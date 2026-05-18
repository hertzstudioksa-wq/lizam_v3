"""Public read-only endpoints + hardened PDF streaming."""
from typing import Any, Optional
import os
import jwt
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse, RedirectResponse
import httpx

from app.config import db, UPLOAD_DIR, JWT_SECRET, JWT_ALG
from app.security import get_optional_user, create_pdf_token, decode_pdf_token, utc_iso

router = APIRouter(prefix="/public", tags=["public"])


# --- Feature-toggle helper ---------------------------------------------------
# Centralised reader so every public endpoint enforces the same view of
# `site_settings.feature_toggles`. Defaults match `models.FeatureToggles`.
_TOGGLE_DEFAULTS = {
    "registration": True,
    "gated_content": True,
    "google_login": False,
    "research_responses": True,
    "public_responses": True,
    "authors_public_page": False,
    "contact_form": True,
    "featured_publications": True,
    "policy_pages": False,
    "pdf_download": True,
    "social_icons": True,
    "email_notifications": False,
}


async def _load_toggles() -> dict:
    doc = await db.site_settings.find_one({"id": "site"}, {"_id": 0, "feature_toggles": 1})
    raw = (doc or {}).get("feature_toggles") or {}
    out = dict(_TOGGLE_DEFAULTS)
    out.update({k: v for k, v in raw.items() if k in _TOGGLE_DEFAULTS})
    return out


@router.get("/site-settings")
async def get_site_settings():
    doc = await db.site_settings.find_one({}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Site settings not seeded")
    # Embed visible custom pages so the Header can build the nav in one request
    custom = await db.custom_pages.find(
        {"visible": True}, {"_id": 0, "id": 1, "slug": 1, "title_ar": 1, "title_en": 1, "sort_order": 1}
    ).sort("sort_order", 1).to_list(length=100)
    doc["custom_pages"] = custom
    return doc


@router.get("/home-content")
async def get_home_content():
    doc = await db.home_content.find_one({}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Home content not seeded")
    return doc


@router.get("/about-content")
async def get_about_content():
    """Public read for the dedicated About page (separate from home)."""
    doc = await db.about_content.find_one({}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="About content not seeded")
    return doc


@router.get("/contact-content")
async def get_contact_content():
    """Public read for the Contact page."""
    doc = await db.contact_content.find_one({"id": "contact"}, {"_id": 0})
    return doc or {}


@router.get("/activities-page")
async def get_activities_page():
    """Public read for the Activities page."""
    doc = await db.activities_page.find_one({"id": "activities"}, {"_id": 0})
    return doc or {}


@router.get("/fellows-page")
async def get_fellows_page():
    doc = await db.fellows_page.find_one({"id": "fellows"}, {"_id": 0})
    return doc or {}


@router.get("/news")
async def list_news(limit: int = 20, offset: int = 0):
    items = await db.news_items.find({"status": "published"}, {"_id": 0, "body_ar": 0, "body_en": 0}).sort("date", -1).skip(offset).limit(limit).to_list(length=limit)
    total = await db.news_items.count_documents({"status": "published"})
    return {"items": items, "total": total}


@router.get("/news/{slug}")
async def get_news_item(slug: str):
    doc = await db.news_items.find_one(
        {"$or": [{"slug_ar": slug}, {"slug_en": slug}, {"id": slug}], "status": "published"},
        {"_id": 0}
    )
    if not doc:
        raise HTTPException(404, "Not found")
    await db.news_items.update_one({"id": doc["id"]}, {"$inc": {"view_count": 1}})
    return doc


@router.get("/publications-page")
async def get_publications_page():
    """Public read for the Publications listing page."""
    doc = await db.publications_page_content.find_one({"id": "publications"}, {"_id": 0})
    return doc or {}


@router.get("/image-assets")
async def public_get_image_assets():
    """Returns active image slots used by the public site."""
    items = await db.image_assets.find(
        {"active": True}, {"_id": 0}
    ).sort("sort_order", 1).to_list(length=200)
    # Map to slot_key → minimal payload for fast lookup
    return {"items": items, "by_slot": {it["slot_key"]: it for it in items}}


@router.get("/publications")
async def list_publications(
    limit: int = 12, offset: int = 0, featured: Optional[bool] = None,
    category: Optional[str] = None, pub_type: Optional[str] = None,
    q: Optional[str] = None, sort: str = "latest",
    author_id: Optional[str] = None,
):
    filt: dict[str, Any] = {"status": "published", "access_level": {"$ne": "hidden"}}
    if featured is not None:
        filt["featured"] = featured
    if category:
        filt["category_id"] = category
    if pub_type:
        filt["publication_type"] = pub_type
    if author_id:
        filt["author_ids"] = author_id
    if q:
        rx = {"$regex": q, "$options": "i"}
        filt["$or"] = [
            {"title_ar": rx}, {"title_en": rx},
            {"summary_ar": rx}, {"summary_en": rx},
            {"tags": rx},
        ]
    sort_key = "published_at"
    sort_dir = -1
    if sort == "oldest":
        sort_dir = 1
    elif sort == "most_viewed":
        sort_key = "view_count"
    cursor = (
        db.publications.find(filt, {"_id": 0, "content_html_ar": 0, "content_html_en": 0})
        .sort(sort_key, sort_dir).skip(offset).limit(limit)
    )
    items = await cursor.to_list(length=limit)
    total = await db.publications.count_documents(filt)
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/publications/{slug}")
async def get_publication(slug: str, request: Request):
    pub = await db.publications.find_one(
        {"$or": [{"slug_ar": slug}, {"slug_en": slug}, {"id": slug}], "status": "published"},
        {"_id": 0},
    )
    if not pub or pub.get("access_level") == "hidden":
        raise HTTPException(status_code=404, detail="Publication not found")

    current = await get_optional_user(request)
    toggles = await _load_toggles()
    access = pub.get("access_level", "public")
    gated = False
    gated_reason = None
    # Global gated_content toggle short-circuits per-publication gating.
    # 'hidden' is still enforced (see 404 above) — it's a publishing decision,
    # not an end-user gating decision.
    if toggles.get("gated_content", True):
        if access == "registered" and not current:
            gated = True
            gated_reason = "login_required"
            pub["content_html_ar"] = ""
            pub["content_html_en"] = ""
        elif access == "preview_login" and not current:
            gated = True
            gated_reason = "preview_only"
            pub["content_html_ar"] = pub.get("preview_html_ar", "")
            pub["content_html_en"] = pub.get("preview_html_en", "")

    pub["_gated"] = gated
    pub["_gated_reason"] = gated_reason
    # Surface effective toggles the SPA needs for this page.
    pub["_pdf_download_enabled"] = bool(toggles.get("pdf_download", True))
    pub["_registration_enabled"] = bool(toggles.get("registration", True))
    pub["_gated_content_enabled"] = bool(toggles.get("gated_content", True))

    author_ids = pub.get("author_ids", []) or []
    pub["authors"] = (
        await db.authors.find({"id": {"$in": author_ids}}, {"_id": 0}).to_list(length=10)
        if author_ids else []
    )
    if pub.get("category_id"):
        pub["category"] = await db.categories.find_one({"id": pub["category_id"]}, {"_id": 0})
    else:
        pub["category"] = None

    rel_filt = {"status": "published", "id": {"$ne": pub["id"]}, "access_level": {"$ne": "hidden"}}
    if pub.get("category_id"):
        rel_filt["category_id"] = pub["category_id"]
    related = await db.publications.find(
        rel_filt,
        {"_id": 0, "id": 1, "title_ar": 1, "title_en": 1, "slug_ar": 1, "slug_en": 1,
         "summary_ar": 1, "summary_en": 1, "publication_type": 1, "access_level": 1,
         "reading_time_minutes": 1, "view_count": 1, "published_at": 1, "category_id": 1,
         "author_ids": 1, "tags": 1, "featured": 1, "cover_image_url": 1},
    ).sort("published_at", -1).limit(3).to_list(length=3)
    pub["related"] = related

    # Adjacent publications (prev = older, next = newer) for page-turning navigation
    pub_date = pub.get("published_at", "")
    _adj_proj = {"_id": 0, "id": 1, "title_ar": 1, "title_en": 1, "slug_ar": 1, "slug_en": 1, "cover_image_url": 1}
    _adj_filt = {"status": "published", "access_level": {"$ne": "hidden"}, "id": {"$ne": pub["id"]}}
    prev_pub = await db.publications.find_one(
        {**_adj_filt, "published_at": {"$lt": pub_date}}, _adj_proj,
        sort=[("published_at", -1)],
    )
    next_pub = await db.publications.find_one(
        {**_adj_filt, "published_at": {"$gt": pub_date}}, _adj_proj,
        sort=[("published_at", 1)],
    )
    pub["_prev"] = prev_pub
    pub["_next"] = next_pub

    # Do not count admin/editor previews or obvious bot UAs toward view_count
    ua = request.headers.get("user-agent", "").lower()
    is_admin_viewer = current and current.get("role") in {"super_admin", "admin", "editor", "reviewer"}
    is_bot = any(b in ua for b in ["bot", "spider", "crawler", "curl/", "python-requests"])
    if not is_admin_viewer and not is_bot:
        try:
            await db.publications.update_one({"id": pub["id"]}, {"$inc": {"view_count": 1}})
            pub["view_count"] = pub.get("view_count", 0) + 1
        except Exception:
            pass

    return pub


@router.get("/publications/{slug}/pdf")
async def request_pdf_token(slug: str, request: Request):
    """Phase 3 hardened: returns a short-lived token, not the raw URL."""
    pub = await db.publications.find_one(
        {"$or": [{"slug_ar": slug}, {"slug_en": slug}, {"id": slug}], "status": "published"},
        {"_id": 0, "id": 1, "pdf_file_url": 1, "external_pdf_url": 1, "pdf_access_level": 1,
         "title_ar": 1, "title_en": 1, "access_level": 1},
    )
    if not pub or pub.get("access_level") == "hidden":
        raise HTTPException(status_code=404, detail="Publication not found")
    toggles = await _load_toggles()
    if not toggles.get("pdf_download", True):
        raise HTTPException(status_code=403, detail="PDF downloads are disabled")
    current = await get_optional_user(request)
    level = pub.get("pdf_access_level", "public")
    if level == "disabled":
        raise HTTPException(status_code=403, detail="PDF access disabled")
    if level == "login_required" and not current:
        raise HTTPException(status_code=401, detail="Login required for PDF download")
    if level == "admin_only" and not (current and current.get("role") in {"super_admin", "admin", "editor", "reviewer"}):
        raise HTTPException(status_code=403, detail="Admin-only PDF")
    if not (pub.get("pdf_file_url") or pub.get("external_pdf_url")):
        raise HTTPException(status_code=404, detail="No PDF attached")

    token = create_pdf_token(pub["id"], current["id"] if current else None, ttl_seconds=300)
    return {"ok": True, "token": token, "title": pub.get("title_ar") or pub.get("title_en"),
            "stream_url": f"/api/public/pdf-stream/{token}"}


@router.get("/pdf-stream/{token}")
async def pdf_stream(token: str, request: Request):
    """Protected PDF delivery — validates short-lived token."""
    try:
        payload = decode_pdf_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="PDF link expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid PDF token")

    pub = await db.publications.find_one(
        {"id": payload["pub"], "status": "published"},
        {"_id": 0, "pdf_file_url": 1, "external_pdf_url": 1, "pdf_access_level": 1, "access_level": 1},
    )
    if not pub or pub.get("access_level") == "hidden" or pub.get("pdf_access_level") == "disabled":
        raise HTTPException(status_code=404, detail="PDF not available")

    toggles = await _load_toggles()
    if not toggles.get("pdf_download", True):
        raise HTTPException(status_code=403, detail="PDF downloads are disabled")

    # Increment PDF download counter
    await db.publications.update_one({"id": payload["pub"]}, {"$inc": {"pdf_download_count": 1}})

    # Prefer uploaded file if present
    if pub.get("pdf_file_url"):
        # Accepts either legacy "/uploads/pdfs/x.pdf" or new "/api/uploads/pdfs/x.pdf".
        rel = pub["pdf_file_url"].lstrip("/")
        for prefix in ("api/uploads/", "uploads/"):
            if rel.startswith(prefix):
                file_path = UPLOAD_DIR / rel[len(prefix):]
                if file_path.is_file():
                    return FileResponse(str(file_path), media_type="application/pdf",
                                        filename=os.path.basename(str(file_path)))
                break
    # Fallback to external URL via server-side fetch (hides the raw URL)
    url = pub.get("external_pdf_url")
    if not url:
        raise HTTPException(status_code=404, detail="No PDF file")

    async def _stream():
        async with httpx.AsyncClient(timeout=30) as c:
            async with c.stream("GET", url) as resp:
                if resp.status_code != 200:
                    raise HTTPException(status_code=502, detail="Upstream PDF fetch failed")
                async for chunk in resp.aiter_bytes():
                    yield chunk

    return StreamingResponse(_stream(), media_type="application/pdf",
                             headers={"Content-Disposition": "inline; filename=\"publication.pdf\""})


@router.get("/authors")
async def list_authors():
    items = await db.authors.find({"active": True}, {"_id": 0, "email": 0}).sort([("sort_order", 1), ("created_at", 1)]).to_list(length=200)
    return {"items": items}


@router.get("/categories")
async def list_categories():
    items = await db.categories.find({"active": True}, {"_id": 0}).sort("sort_order", 1).to_list(length=200)
    return {"items": items}


@router.get("/custom-pages")
async def list_custom_pages():
    items = await db.custom_pages.find({"visible": True}, {"_id": 0}).sort("sort_order", 1).to_list(length=100)
    return {"items": items}


@router.get("/custom-pages/{slug}")
async def get_custom_page(slug: str):
    doc = await db.custom_pages.find_one({"slug": slug, "visible": True}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Page not found")
    return doc


@router.post("/contact")
async def public_submit_contact(body: dict, request: Request):
    """Public contact form submission. Rate-limited per email + per IP."""
    from app.rate_limit import check_and_record_attempt, reset_fail
    from app.email_adapter import send_email
    from app.security import uid
    from app.sanitize import sanitize_text

    site = await db.site_settings.find_one({"id": "site"}, {"_id": 0, "feature_toggles": 1, "contact_email": 1})
    toggles = (site or {}).get("feature_toggles", {}) or {}
    if not toggles.get("contact_form", True):
        raise HTTPException(status_code=503, detail="Contact form is disabled")

    name = (body.get("name") or "").strip()[:120]
    email = (body.get("email") or "").strip().lower()[:160]
    subject = (body.get("subject") or "").strip()[:240]
    message = (body.get("message") or "").strip()[:4000]
    if not name or not email or not message or "@" not in email:
        raise HTTPException(status_code=400, detail="Name, valid email, and message are required")
    if not body.get("consent"):
        raise HTTPException(status_code=400, detail="Consent is required")

    await check_and_record_attempt(request, "contact", subject=email,
                                   max_fails=5, window_s=600, lock_s=1800)

    doc = {
        "id": uid(),
        "name": sanitize_text(name),
        "email": email,
        "subject": sanitize_text(subject),
        "message": sanitize_text(message),
        "status": "new",
        "created_at": utc_iso(),
        "ip": request.client.host if request.client else "",
    }
    await db.contact_messages.insert_one(doc)
    await reset_fail([f"contact:subj:{email}"])

    # best-effort admin notification
    try:
        await send_email(
            to=(site or {}).get("contact_email") or "admin@lizam.sa",
            subject=f"[LIZAM contact] {subject or 'No subject'}",
            html=f"<p><b>From:</b> {name} &lt;{email}&gt;</p><p>{message.replace(chr(10), '<br>')}</p>",
            tags={"kind": "contact"},
        )
    except Exception:  # noqa: BLE001
        pass
    return {"ok": True, "id": doc["id"]}


@router.post("/newsletter/subscribe")
async def public_newsletter_subscribe(body: dict, request: Request):
    """Public newsletter signup. Stores email in Mongo (idempotent on email).
    Email delivery is a no-op until a Resend key is configured. Rate-limited
    per IP to prevent abuse.
    """
    from app.rate_limit import check_and_record_attempt, reset_fail
    from app.security import uid

    email = (body.get("email") or "").strip().lower()[:160]
    language = (body.get("language") or "ar").strip().lower()
    if language not in ("ar", "en"):
        language = "ar"
    if not email or "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="A valid email address is required")

    # Per-IP rate limiting: 8 submissions per 10 min, 30 min lock.
    await check_and_record_attempt(
        request, "newsletter", subject=email,
        max_fails=8, window_s=600, lock_s=1800,
    )

    existing = await db.newsletter_subscribers.find_one(
        {"email": email}, {"_id": 0, "id": 1, "status": 1}
    )
    if existing:
        # Reactivate if previously unsubscribed
        if existing.get("status") != "active":
            await db.newsletter_subscribers.update_one(
                {"email": email},
                {"$set": {"status": "active", "language": language, "resubscribed_at": utc_iso()}},
            )
        await reset_fail([f"newsletter:subj:{email}"])
        return {"ok": True, "id": existing["id"], "already_subscribed": True}

    doc = {
        "id": uid(),
        "email": email,
        "language": language,
        "status": "active",
        "source": "home_newsletter",
        "created_at": utc_iso(),
        "ip": request.client.host if request.client else "",
    }
    await db.newsletter_subscribers.insert_one(doc)
    await reset_fail([f"newsletter:subj:{email}"])
    return {"ok": True, "id": doc["id"], "already_subscribed": False}

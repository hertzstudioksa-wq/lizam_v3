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


@router.get("/site-settings")
async def get_site_settings():
    doc = await db.site_settings.find_one({}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Site settings not seeded")
    return doc


@router.get("/home-content")
async def get_home_content():
    doc = await db.home_content.find_one({}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Home content not seeded")
    return doc


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
):
    filt: dict[str, Any] = {"status": "published", "access_level": {"$ne": "hidden"}}
    if featured is not None:
        filt["featured"] = featured
    if category:
        filt["category_id"] = category
    if pub_type:
        filt["publication_type"] = pub_type
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
    access = pub.get("access_level", "public")
    gated = False
    gated_reason = None
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
         "author_ids": 1, "tags": 1, "featured": 1},
    ).sort("published_at", -1).limit(3).to_list(length=3)
    pub["related"] = related

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

    # Prefer uploaded file if present
    if pub.get("pdf_file_url"):
        # Expect relative path like /uploads/pdfs/xxx.pdf
        rel = pub["pdf_file_url"].lstrip("/")
        file_path = UPLOAD_DIR / rel.replace("uploads/", "", 1) if rel.startswith("uploads/") else None
        if file_path and file_path.is_file():
            return FileResponse(str(file_path), media_type="application/pdf",
                                filename=os.path.basename(str(file_path)))
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
    items = await db.authors.find({"active": True}, {"_id": 0, "email": 0}).to_list(length=200)
    return {"items": items}


@router.get("/categories")
async def list_categories():
    items = await db.categories.find({"active": True}, {"_id": 0}).sort("sort_order", 1).to_list(length=200)
    return {"items": items}


@router.post("/publications/{slug}/responses")
async def submit_response_placeholder(slug: str):
    raise HTTPException(status_code=503, detail="Responses workflow will be enabled in Phase 5")

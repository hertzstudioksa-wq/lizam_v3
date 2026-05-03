"""Research Responses workflow (Phase 5): public submission + admin moderation.

Lifecycle: submitted → under_review → approved | rejected | archived

Public can only submit (respecting global + per-publication toggles).
Approved + public_visible responses surface on the publication detail via public.py.
Admin moderates through /api/admin/responses/*.
"""
from __future__ import annotations
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from fastapi import APIRouter, Depends, HTTPException, Request
from app.config import db
from app.security import (
    require_permission, get_optional_user, uid, utc_iso,
)
from app.sanitize import sanitize_html
from app.rate_limit import check_and_record_attempt, record_fail, reset_fail

STATUSES = ("submitted", "under_review", "approved", "rejected", "archived")


# ---------------- Models ---------------- #
class ResponseSubmitIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str = Field(..., min_length=3, max_length=240)
    body: str = Field(..., min_length=10, max_length=15000)
    author_name: Optional[str] = Field(None, max_length=120)
    author_email: Optional[EmailStr] = None
    consent: bool = False


class ResponseModerateIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: Optional[Literal["submitted", "under_review", "approved", "rejected", "archived"]] = None
    public_visible: Optional[bool] = None
    internal_notes: Optional[str] = None


# ---------------- Admin router ---------------- #
admin_router = APIRouter(prefix="/admin/responses", tags=["admin", "responses"])


@admin_router.get("")
async def admin_list_responses(
    status: Optional[str] = None,
    publication_id: Optional[str] = None,
    user: dict = Depends(require_permission("responses.moderate")),
):
    q = {}
    if status and status in STATUSES:
        q["status"] = status
    if publication_id:
        q["publication_id"] = publication_id
    items = await db.research_responses.find(q, {"_id": 0}).sort("submitted_at", -1).to_list(length=500)
    # Enrich with publication title for display
    pub_ids = list({it["publication_id"] for it in items if it.get("publication_id")})
    pubs = {p["id"]: p async for p in db.publications.find({"id": {"$in": pub_ids}}, {"_id": 0, "id": 1, "title_ar": 1, "title_en": 1})}
    for it in items:
        p = pubs.get(it.get("publication_id"))
        if p:
            it["_publication_title_ar"] = p.get("title_ar")
            it["_publication_title_en"] = p.get("title_en")
    return {"items": items}


@admin_router.get("/{response_id}")
async def admin_get_response(response_id: str,
                             user: dict = Depends(require_permission("responses.moderate"))):
    doc = await db.research_responses.find_one({"id": response_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Response not found")
    return doc


@admin_router.patch("/{response_id}")
async def admin_update_response(response_id: str, body: ResponseModerateIn,
                                user: dict = Depends(require_permission("responses.moderate"))):
    doc = await db.research_responses.find_one({"id": response_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Response not found")
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if "status" in update:
        if update["status"] == "approved":
            update["approved_at"] = utc_iso()
            update["approved_by"] = user.get("email", "")
            update.setdefault("public_visible", True)
    update["updated_at"] = utc_iso()
    update["updated_by"] = user.get("email", "")
    await db.research_responses.update_one({"id": response_id}, {"$set": update})
    # audit log
    try:
        from app.routers.admin import audit_log  # local import avoids cycle
        await audit_log(user, "moderate", "response", response_id, {"status": update.get("status")})
    except Exception:  # noqa: BLE001
        pass
    doc = await db.research_responses.find_one({"id": response_id}, {"_id": 0})
    return doc


@admin_router.delete("/{response_id}")
async def admin_delete_response(response_id: str,
                                user: dict = Depends(require_permission("responses.moderate"))):
    r = await db.research_responses.delete_one({"id": response_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Response not found")
    try:
        from app.routers.admin import audit_log
        await audit_log(user, "delete", "response", response_id)
    except Exception:  # noqa: BLE001
        pass
    return {"ok": True}


# ---------------- Public router ---------------- #
public_router = APIRouter(prefix="/public", tags=["public", "responses"])


@public_router.post("/publications/{slug}/responses", status_code=201)
async def submit_response(slug: str, body: ResponseSubmitIn, request: Request,
                          user: Optional[dict] = Depends(get_optional_user)):
    # Resolve publication by slug (AR or EN)
    pub = await db.publications.find_one(
        {"$or": [{"slug_ar": slug}, {"slug_en": slug}], "status": "published"},
        {"_id": 0, "id": 1, "responses_enabled": 1, "access_level": 1},
    )
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")

    # Global feature toggle check
    site = await db.site_settings.find_one({"id": "site"}, {"_id": 0, "feature_toggles": 1})
    toggles = (site or {}).get("feature_toggles", {}) or {}
    if not toggles.get("research_responses", True):
        raise HTTPException(status_code=503, detail="Responses are currently disabled site-wide")
    if pub.get("responses_enabled") is False:
        raise HTTPException(status_code=403, detail="Responses are disabled for this publication")

    # Require consent
    if not body.consent:
        raise HTTPException(status_code=400, detail="Consent is required to submit")

    # If user is anonymous, author_name + author_email are required
    author_name = body.author_name or (user.get("name") if user else None)
    author_email = body.author_email or (user.get("email") if user else None)
    if not author_name or not author_email:
        raise HTTPException(status_code=400, detail="Name and email are required")

    # Rate limit per email + per IP
    keys = await check_and_record_attempt(request, "response_submit", subject=author_email,
                                          max_fails=6, window_s=600, lock_s=1800)

    try:
        # Sanitize title (plain text) + body (HTML — allow editorial tags only)
        safe_title = (body.title or "").strip()
        safe_body_html = sanitize_html(body.body or "")

        doc = {
            "id": uid(),
            "publication_id": pub["id"],
            "title": safe_title,
            "body_html": safe_body_html,
            "author_name": author_name.strip()[:120],
            "author_email": author_email.strip().lower(),
            "author_user_id": user.get("id") if user else None,
            "status": "submitted",
            "public_visible": False,
            "internal_notes": "",
            "consent": True,
            "submitted_at": utc_iso(),
            "updated_at": utc_iso(),
            "ip": request.client.host if request.client else "",
        }
        await db.research_responses.insert_one(doc)
    except Exception:
        # Count this as a failed attempt so abuse doesn't bypass the rate limit
        await record_fail(keys, max_fails=6, window_s=600, lock_s=1800)
        raise

    # Successful submission — reset the rate window for this user (they earned trust)
    await reset_fail([f"response_submit:subj:{author_email.lower()}"])

    # Best-effort admin email (no-op when Resend not configured)
    try:
        from app.email_adapter import send_email
        await send_email(
            to=(site or {}).get("contact_email") or "admin@lizam.sa",
            subject=f"[LIZAM] New research response: {safe_title[:80]}",
            html=f"<p>A new response was submitted for publication <code>{pub['id']}</code> by {author_name} &lt;{author_email}&gt;.</p><p>Moderate at /admin/responses</p>",
            tags={"kind": "response_submitted"},
        )
    except Exception:  # noqa: BLE001
        pass

    return {"ok": True, "id": doc["id"], "status": "submitted"}


@public_router.get("/publications/{slug}/responses")
async def public_list_responses(slug: str):
    """Returns approved + public_visible responses for a publication."""
    pub = await db.publications.find_one(
        {"$or": [{"slug_ar": slug}, {"slug_en": slug}], "status": "published"},
        {"_id": 0, "id": 1},
    )
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")
    items = await db.research_responses.find(
        {"publication_id": pub["id"], "status": "approved", "public_visible": True},
        {"_id": 0, "id": 1, "title": 1, "body_html": 1, "author_name": 1, "submitted_at": 1, "approved_at": 1},
    ).sort("approved_at", -1).to_list(length=100)
    return {"items": items}

"""Emergent-managed Google Login router.

Flow:
  1. Frontend redirects user to https://auth.emergentagent.com/?redirect=<our_redirect>.
  2. Emergent bounces user to Google, then back to {redirect}#session_id=xxx.
  3. Frontend reads session_id from URL fragment and POSTs it to /api/auth/google/callback.
  4. This router calls Emergent's session-data endpoint with X-Session-ID, receives
     {id, email, name, picture, session_token}, upserts a LIZAM user, and issues our
     standard JWT access+refresh cookies (same as email/password login).
  5. Emergent session_token is NOT stored — we rely on our own JWTs.

Controlled by feature_toggles.google_login (default off). If toggled off, all
/auth/google/* endpoints return 503.

Migration to a custom Google OAuth Client (later):
  - Replace the call to https://demobackend.emergentagent.com/... with the
    google-auth-oauthlib flow using your own GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET.
  - Keep the user upsert + JWT issuance logic unchanged — only the "fetch profile"
    step changes.
"""
from __future__ import annotations
import httpx
from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel, ConfigDict
from app.config import db
from app.security import (
    create_access_token, create_refresh_token, set_auth_cookies, uid, utc_iso,
)
from app.rate_limit import check_and_record_attempt

router = APIRouter(prefix="/auth/google", tags=["auth", "google"])

SESSION_DATA_ENDPOINT = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


class GoogleCallbackIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str


async def _is_enabled() -> bool:
    site = await db.site_settings.find_one({"id": "site"}, {"_id": 0, "feature_toggles": 1})
    toggles = (site or {}).get("feature_toggles", {}) or {}
    return bool(toggles.get("google_login", False))


@router.get("/status")
async def google_status():
    """Lightweight endpoint the frontend polls to decide whether to render the Google button."""
    return {"enabled": await _is_enabled()}


@router.post("/callback")
async def google_callback(body: GoogleCallbackIn, request: Request, response: Response):
    if not await _is_enabled():
        raise HTTPException(status_code=503, detail="Google login is disabled")

    # Light rate limit by IP to prevent session-id brute force abuse
    await check_and_record_attempt(request, "google_callback", max_fails=20, window_s=300, lock_s=900)

    session_id = (body.session_id or "").strip()
    if not session_id or len(session_id) < 16:
        raise HTTPException(status_code=400, detail="Invalid session_id")

    # Fetch profile from Emergent
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(SESSION_DATA_ENDPOINT, headers={"X-Session-ID": session_id})
            if r.status_code != 200:
                raise HTTPException(status_code=401, detail="Emergent session invalid or expired")
            profile = r.json()
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Failed to reach Emergent Auth: {e}")

    email = (profile.get("email") or "").strip().lower()
    name = profile.get("name") or email.split("@")[0]
    picture = profile.get("picture") or ""
    if not email:
        raise HTTPException(status_code=400, detail="Google profile missing email")

    # Upsert user (no password — auth_provider='google')
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user = {
            "id": uid(),
            "email": email,
            "name": name,
            "password_hash": "",
            "role": "registered",
            "role_key": "registered",
            "status": "active",
            "auth_provider": "google",
            "picture": picture,
            "created_at": utc_iso(),
            "updated_at": utc_iso(),
        }
        await db.users.insert_one(user)
    else:
        # Refresh name/picture; do not clobber role/status
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {
                "name": name or user.get("name", ""),
                "picture": picture or user.get("picture", ""),
                "auth_provider": user.get("auth_provider") or "google",
                "updated_at": utc_iso(),
            }},
        )

    # Issue our standard JWT cookies
    role = user.get("role") or user.get("role_key") or "registered"
    access = create_access_token(user["id"], email, role)
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)

    # Audit log (best-effort)
    try:
        from app.routers.admin import audit_log
        await audit_log({"email": email, "id": user["id"]}, "login", "user", user["id"], {"via": "google"})
    except Exception:  # noqa: BLE001
        pass

    return {
        "ok": True,
        "user": {k: user.get(k) for k in ("id", "email", "name", "role", "picture")},
    }

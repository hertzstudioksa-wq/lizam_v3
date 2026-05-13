"""Auth router with simple in-memory rate-limit on /login."""
import time
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Request, Response, Depends
import jwt

from app.config import db, JWT_SECRET, JWT_ALG
from app.models import RegisterIn, LoginIn
from app.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    set_auth_cookies, set_access_token_cookie, clear_auth_cookies, get_current_user, uid, utc_iso,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# Rate limit: 5 failed attempts per email / per IP in 5 min → 429 for 15 min
_MAX_FAILS = 5
_WINDOW_S = 5 * 60
_LOCK_S = 15 * 60
_fail_log: dict[str, list[float]] = defaultdict(list)
_locked: dict[str, float] = {}


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_lockout(keys: list[str]) -> None:
    now = time.time()
    for k in keys:
        locked_until = _locked.get(k, 0)
        if locked_until > now:
            raise HTTPException(
                status_code=429,
                detail=f"Too many failed attempts. Try again in {int((locked_until-now)/60)+1} minutes.",
            )


def _record_fail(keys: list[str]) -> None:
    now = time.time()
    for k in keys:
        log = _fail_log[k]
        log.append(now)
        # drop old entries outside window
        _fail_log[k] = [t for t in log if now - t < _WINDOW_S]
        if len(_fail_log[k]) >= _MAX_FAILS:
            _locked[k] = now + _LOCK_S
            _fail_log[k] = []


def _reset_fail(keys: list[str]) -> None:
    for k in keys:
        _fail_log.pop(k, None)
        _locked.pop(k, None)


@router.post("/register")
async def register(body: RegisterIn, request: Request, response: Response):
    # Honour global registration toggle.
    site = await db.site_settings.find_one(
        {"id": "site"}, {"_id": 0, "feature_toggles": 1}
    )
    toggles = (site or {}).get("feature_toggles") or {}
    if toggles.get("registration", True) is False:
        raise HTTPException(status_code=403, detail="Registration is currently disabled")
    email = body.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = {
        "id": uid(), "name": body.name.strip(), "email": email,
        "password_hash": hash_password(body.password),
        "role": "registered", "status": "active", "auth_provider": "local",
        "created_at": utc_iso(), "updated_at": utc_iso(),
    }
    await db.users.insert_one(user)
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh, request)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return user


@router.post("/login")
async def login(body: LoginIn, request: Request, response: Response):
    from app.rate_limit import check_and_record_attempt, record_fail, reset_fail
    email = body.email.lower()
    keys = await check_and_record_attempt(request, "login", subject=email,
                                          max_fails=5, window_s=300, lock_s=900)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        await record_fail(keys, max_fails=5, window_s=300, lock_s=900)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.get("status") and user["status"] != "active":
        raise HTTPException(status_code=403, detail="Account deactivated")
    await reset_fail(keys)
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh, request)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return user


@router.post("/logout")
async def logout(request: Request, response: Response):
    clear_auth_cookies(response, request)
    return {"ok": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(user["id"], user["email"], user["role"])
        set_access_token_cookie(response, access, request)
        return {"ok": True}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

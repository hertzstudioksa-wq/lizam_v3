"""Security utilities: password hashing, JWT, auth dependencies."""
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException, Request, Response
from app.config import JWT_SECRET, JWT_ALG, ADMIN_ROLES, db, has_permission


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def utc_iso() -> str:
    return utc_now().isoformat()


def uid() -> str:
    return str(uuid.uuid4())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:  # noqa: BLE001
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    return jwt.encode(
        {"sub": user_id, "email": email, "role": role, "type": "access",
         "exp": utc_now() + timedelta(minutes=60)},
        JWT_SECRET, algorithm=JWT_ALG,
    )


def create_refresh_token(user_id: str) -> str:
    return jwt.encode(
        {"sub": user_id, "type": "refresh", "exp": utc_now() + timedelta(days=7)},
        JWT_SECRET, algorithm=JWT_ALG,
    )


def create_pdf_token(pub_id: str, user_id: str | None, ttl_seconds: int = 300) -> str:
    """Short-lived token for PDF streaming. Encodes pub id + user id."""
    return jwt.encode(
        {"pub": pub_id, "u": user_id or "anon", "type": "pdf",
         "exp": utc_now() + timedelta(seconds=ttl_seconds)},
        JWT_SECRET, algorithm=JWT_ALG,
    )


def decode_pdf_token(token: str) -> dict:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    if payload.get("type") != "pdf":
        raise jwt.InvalidTokenError("wrong token type")
    return payload


def _cookie_flags(request: Request) -> tuple[bool, str]:
    """HTTPS → Secure + SameSite=None (cross-site). HTTP (local dev) → no Secure + Lax."""
    secure = request.url.scheme == "https"
    samesite = "none" if secure else "lax"
    return secure, samesite


def set_auth_cookies(response: Response, access: str, refresh: str, request: Request) -> None:
    secure, samesite = _cookie_flags(request)
    response.set_cookie(
        "access_token", access, httponly=True, secure=secure, samesite=samesite,
        max_age=3600, path="/",
    )
    response.set_cookie(
        "refresh_token", refresh, httponly=True, secure=secure, samesite=samesite,
        max_age=7 * 24 * 3600, path="/",
    )


def set_access_token_cookie(response: Response, access: str, request: Request) -> None:
    secure, samesite = _cookie_flags(request)
    response.set_cookie(
        "access_token", access, httponly=True, secure=secure, samesite=samesite,
        max_age=3600, path="/",
    )


def clear_auth_cookies(response: Response, request: Request) -> None:
    secure, samesite = _cookie_flags(request)
    response.delete_cookie("access_token", path="/", secure=secure, samesite=samesite)
    response.delete_cookie("refresh_token", path="/", secure=secure, samesite=samesite)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user.get("status") and user["status"] != "active":
            raise HTTPException(status_code=403, detail="User deactivated")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_optional_user(request: Request) -> dict | None:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def require_permission(permission_key: str):
    async def _dep(user: dict = Depends(get_current_user)) -> dict:
        if not has_permission(user.get("role", ""), permission_key):
            raise HTTPException(status_code=403, detail=f"Missing permission: {permission_key}")
        return user
    return _dep

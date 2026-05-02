"""LIZAM Center for Legal Research — Backend API (Phase 1).

Phase 1 scope:
- Site Settings (singleton, bilingual, brand + feature toggles)
- Home Content (singleton, bilingual sections)
- Publication metadata model (full fields — list endpoint + seed only for now)
- Authors / Categories (structural, list endpoints only)
- Auth scaffolding (register/login/me/logout/refresh, JWT httpOnly cookies, bcrypt)
- Role-based admin guard
- Seeded roles + super-admin on startup
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="LIZAM API", version="0.1.0")
api = APIRouter(prefix="/api")

logger = logging.getLogger("lizam")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def utc_iso() -> str:
    return utc_now().isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:  # noqa: BLE001
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "access",
        "exp": utc_now() + timedelta(minutes=60),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": utc_now() + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none",
                        max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none",
                        max_age=7 * 24 * 3600, path="/")


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class BaseDoc(BaseModel):
    model_config = ConfigDict(extra="ignore")


class UserOut(BaseDoc):
    id: str
    name: str
    email: EmailStr
    role: str
    status: str = "active"
    auth_provider: str = "local"
    created_at: str


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class SocialLinks(BaseModel):
    twitter: Optional[str] = ""
    linkedin: Optional[str] = ""
    youtube: Optional[str] = ""
    facebook: Optional[str] = ""
    instagram: Optional[str] = ""


class FeatureToggles(BaseModel):
    registration: bool = True
    gated_content: bool = True
    google_login: bool = False
    research_responses: bool = True
    public_responses: bool = True
    authors_public_page: bool = False
    contact_form: bool = True
    featured_publications: bool = True
    policy_pages: bool = False
    pdf_download: bool = True
    social_icons: bool = True


# ---------------------------------------------------------------------------
# Current user dependency
# ---------------------------------------------------------------------------
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
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") not in {"super_admin", "admin", "editor", "reviewer"}:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/register", response_model=UserOut)
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "name": body.name.strip(),
        "email": email,
        "password_hash": hash_password(body.password),
        "role": "registered",
        "status": "active",
        "auth_provider": "local",
        "created_at": utc_iso(),
        "updated_at": utc_iso(),
    }
    await db.users.insert_one(user)
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return user


@auth_router.post("/login", response_model=UserOut)
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return user


@auth_router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}


@auth_router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return user


@auth_router.post("/refresh")
async def refresh(request: Request, response: Response):
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
        response.set_cookie("access_token", access, httponly=True, secure=True,
                            samesite="none", max_age=3600, path="/")
        return {"ok": True}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------
public_router = APIRouter(prefix="/public", tags=["public"])


@public_router.get("/site-settings")
async def get_site_settings():
    doc = await db.site_settings.find_one({}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Site settings not seeded")
    return doc


@public_router.get("/home-content")
async def get_home_content():
    doc = await db.home_content.find_one({}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Home content not seeded")
    return doc


@public_router.get("/publications")
async def list_publications(
    limit: int = 12, offset: int = 0, featured: Optional[bool] = None,
    category: Optional[str] = None, pub_type: Optional[str] = None,
    q: Optional[str] = None, sort: str = "latest",
):
    filt: dict[str, Any] = {"status": "published"}
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
        sort_dir = -1
    cursor = (
        db.publications.find(filt, {"_id": 0, "content_html_ar": 0, "content_html_en": 0})
        .sort(sort_key, sort_dir)
        .skip(offset)
        .limit(limit)
    )
    items = await cursor.to_list(length=limit)
    total = await db.publications.count_documents(filt)
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@public_router.get("/publications/{slug}")
async def get_publication(slug: str, request: Request):
    # Find by slug_ar or slug_en
    pub = await db.publications.find_one(
        {"$or": [{"slug_ar": slug}, {"slug_en": slug}, {"id": slug}], "status": "published"},
        {"_id": 0},
    )
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")

    # Determine current user (optional)
    current = None
    try:
        current = await get_current_user(request)
    except HTTPException:
        current = None

    access = pub.get("access_level", "public")
    gated = False
    gated_reason = None
    if access == "hidden":
        raise HTTPException(status_code=404, detail="Publication not found")
    if access == "registered" and not current:
        gated = True
        gated_reason = "login_required"
        pub["content_html_ar"] = ""
        pub["content_html_en"] = ""
    elif access == "preview_login" and not current:
        gated = True
        gated_reason = "preview_only"
        # Keep preview_html, redact full content
        pub["content_html_ar"] = pub.get("preview_html_ar", "")
        pub["content_html_en"] = pub.get("preview_html_en", "")

    pub["_gated"] = gated
    pub["_gated_reason"] = gated_reason

    # Resolve author + category (hydrate for UI convenience)
    author_ids = pub.get("author_ids", []) or []
    if author_ids:
        authors = await db.authors.find({"id": {"$in": author_ids}}, {"_id": 0}).to_list(length=10)
        pub["authors"] = authors
    else:
        pub["authors"] = []
    if pub.get("category_id"):
        cat = await db.categories.find_one({"id": pub["category_id"]}, {"_id": 0})
        pub["category"] = cat
    else:
        pub["category"] = None

    # Related publications (same category, excluding self)
    rel_filt = {"status": "published", "id": {"$ne": pub["id"]}}
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

    # Increment view count (fire and forget)
    try:
        await db.publications.update_one({"id": pub["id"]}, {"$inc": {"view_count": 1}})
        pub["view_count"] = pub.get("view_count", 0) + 1
    except Exception:
        pass

    return pub


@public_router.get("/publications/{slug}/pdf")
async def stream_publication_pdf(slug: str, request: Request):
    """Protected PDF access endpoint. Enforces pdf_access_level server-side.
    Returns a redirect to the actual PDF URL (uploaded or external) only if allowed.
    In Phase 2 we return JSON with the url + access decision — frontend handles the
    navigation. A later phase can stream from an auth-protected storage."""
    pub = await db.publications.find_one(
        {"$or": [{"slug_ar": slug}, {"slug_en": slug}, {"id": slug}], "status": "published"},
        {"_id": 0, "id": 1, "pdf_file_url": 1, "external_pdf_url": 1, "pdf_access_level": 1, "title_ar": 1, "title_en": 1},
    )
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")

    current = None
    try:
        current = await get_current_user(request)
    except HTTPException:
        current = None

    level = pub.get("pdf_access_level", "public")
    if level == "disabled":
        raise HTTPException(status_code=403, detail="PDF access disabled")
    if level in {"login_required"} and not current:
        raise HTTPException(status_code=401, detail="Login required for PDF download")
    if level == "admin_only" and not (current and current.get("role") in {"super_admin", "admin", "editor", "reviewer"}):
        raise HTTPException(status_code=403, detail="Admin-only PDF")

    url = pub.get("pdf_file_url") or pub.get("external_pdf_url")
    if not url:
        raise HTTPException(status_code=404, detail="No PDF attached")
    return {"ok": True, "url": url, "title": pub.get("title_ar") or pub.get("title_en")}


@public_router.post("/publications/{slug}/responses")
async def submit_response_placeholder(slug: str):
    """Phase 2 placeholder — actual moderation workflow is Phase 5."""
    raise HTTPException(status_code=503, detail="Responses workflow will be enabled in Phase 5")


@public_router.get("/authors")
async def list_authors():
    items = await db.authors.find({"active": True}, {"_id": 0}).to_list(length=200)
    return {"items": items}


@public_router.get("/categories")
async def list_categories():
    items = await db.categories.find({"active": True}, {"_id": 0}).sort("sort_order", 1).to_list(length=200)
    return {"items": items}


# ---------------------------------------------------------------------------
# Admin routes (shell only for Phase 1)
# ---------------------------------------------------------------------------
admin_router = APIRouter(prefix="/admin", tags=["admin"])


@admin_router.get("/overview")
async def admin_overview(user: dict = Depends(require_admin)):
    pubs_total = await db.publications.count_documents({})
    pubs_published = await db.publications.count_documents({"status": "published"})
    pubs_draft = await db.publications.count_documents({"status": "draft"})
    users_total = await db.users.count_documents({})
    responses_pending = await db.research_responses.count_documents({"status": "submitted"})
    messages_new = await db.contact_messages.count_documents({"status": "new"})
    return {
        "publications_total": pubs_total,
        "publications_published": pubs_published,
        "publications_draft": pubs_draft,
        "users_total": users_total,
        "responses_pending": responses_pending,
        "messages_new": messages_new,
    }


# Mount routers
api.include_router(auth_router)
api.include_router(public_router)
api.include_router(admin_router)


@api.get("/healthz")
async def healthz():
    return {"ok": True, "service": "lizam-api", "ts": utc_iso()}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Seeding data
# ---------------------------------------------------------------------------
def _obj(**kw):
    kw.setdefault("id", str(uuid.uuid4()))
    return kw


DEFAULT_OBJECTIVES = [
    _obj(sort_order=1,
         title_ar="تطوير الدراسات القانونية", title_en="Advancing Legal Studies",
         description_ar="إنتاج دراسات وبحوث قانونية رصينة تخدم المنظومة التشريعية والقضائية.",
         description_en="Producing rigorous legal studies that serve the legislative and judicial landscape."),
    _obj(sort_order=2,
         title_ar="دعم الحوكمة في القطاع العام", title_en="Supporting Public Sector Governance",
         description_ar="تقديم أوراق سياسات وتحليلات مؤسسية ترفد صناع القرار.",
         description_en="Delivering policy papers and institutional analysis to inform decision-makers."),
    _obj(sort_order=3,
         title_ar="خدمة القطاع الخاص", title_en="Serving the Private Sector",
         description_ar="رصد التحولات التنظيمية وتوضيح أثرها على بيئة الأعمال.",
         description_en="Tracking regulatory shifts and clarifying their impact on business environments."),
    _obj(sort_order=4,
         title_ar="بناء القدرات البحثية", title_en="Building Research Capabilities",
         description_ar="تأهيل باحثين قانونيين متخصصين عبر برامج ومبادرات بحثية.",
         description_en="Developing specialized legal researchers through structured programs and initiatives."),
    _obj(sort_order=5,
         title_ar="إتاحة المعرفة القانونية", title_en="Promoting Open Access to Knowledge",
         description_ar="توفير بيئة معرفية مفتوحة تُسهم في ترسيخ الثقافة القانونية.",
         description_en="Providing an open knowledge environment that strengthens legal culture."),
]

DEFAULT_FIELDS = [
    _obj(sort_order=1, icon="scroll-text", active=True,
         title_ar="الدراسات التشريعية", title_en="Legislative Studies",
         description_ar="تحليل الأنظمة واللوائح وتقييم كفاءتها وانسجامها مع الأهداف التشريعية.",
         description_en="Analysing regulations and assessing their coherence with legislative objectives."),
    _obj(sort_order=2, icon="gavel", active=True,
         title_ar="الممارسات القضائية والتاريخ المؤسسي", title_en="Judicial Practices & Institutional History",
         description_ar="دراسة التطور المؤسسي للقضاء وتوثيق الممارسات والمبادئ المستقرة.",
         description_en="Studying the institutional evolution of the judiciary and documenting established principles."),
    _obj(sort_order=3, icon="landmark", active=True,
         title_ar="السياسات العامة والحوكمة", title_en="Public Policy & Governance",
         description_ar="صياغة أطر سياسات عامة قائمة على الأدلة والممارسات الفضلى.",
         description_en="Framing evidence-based public policy grounded in best practice."),
    _obj(sort_order=4, icon="book-open", active=True,
         title_ar="الشريعة الإسلامية والأنظمة القانونية", title_en="Islamic Sharia & Legal Systems",
         description_ar="دراسة العلاقة بين المنظومة الشرعية والمنظومات القانونية المقارنة.",
         description_en="Studying the relationship between Islamic jurisprudence and comparative legal systems."),
    _obj(sort_order=5, icon="compass", active=True,
         title_ar="المجالات المتخصصة والناشئة", title_en="Specialised & Emerging Fields",
         description_ar="تتبع القضايا القانونية الناشئة في الاقتصاد الرقمي والتقنية والبيئة.",
         description_en="Tracking emerging legal questions in digital economy, technology, and environment."),
]


SEED_PUBLICATIONS = [
    {
        "title_ar": "تطور الأنظمة التشريعية في المملكة العربية السعودية",
        "title_en": "The Evolution of Legislative Systems in the Kingdom of Saudi Arabia",
        "publication_type": "study",
        "summary_ar": "دراسة تستعرض مراحل التطور التشريعي وأثرها على البناء المؤسسي للدولة الحديثة.",
        "summary_en": "A study reviewing stages of legislative development and their impact on modern state-building.",
        "tags": ["تشريع", "حوكمة", "تاريخ قانوني"],
        "featured": True, "status": "published", "access_level": "preview_login",
        "reading_time_minutes": 18, "view_count": 412,
    },
    {
        "title_ar": "قراءة في ضوابط السياسة العامة وأثرها على بيئة الأعمال",
        "title_en": "Reading Public Policy Frameworks and Their Impact on Business",
        "publication_type": "policy_paper",
        "summary_ar": "ورقة سياسات تبحث في توازن البيئة التنظيمية بين حماية المصلحة العامة وتمكين القطاع الخاص.",
        "summary_en": "A policy paper on balancing regulatory oversight with private sector enablement.",
        "tags": ["سياسات عامة", "تنظيم", "اقتصاد"],
        "featured": True, "status": "published", "access_level": "public",
        "reading_time_minutes": 12, "view_count": 278,
    },
    {
        "title_ar": "حوكمة الذكاء الاصطناعي: إطار قانوني مقترح",
        "title_en": "Governing Artificial Intelligence: A Proposed Legal Framework",
        "publication_type": "research",
        "summary_ar": "بحث يقترح إطاراً قانونياً لحوكمة تقنيات الذكاء الاصطناعي بما يراعي الخصوصية والمسؤولية.",
        "summary_en": "Research proposing a legal framework for AI governance covering privacy and accountability.",
        "tags": ["ذكاء اصطناعي", "حوكمة", "قانون ناشئ"],
        "featured": False, "status": "published", "access_level": "registered",
        "reading_time_minutes": 25, "view_count": 164,
    },
]


async def seed_on_startup() -> None:
    # Roles
    await db.roles.create_index("key", unique=True)
    default_roles = [
        {"key": "super_admin", "name_ar": "مدير عام", "name_en": "Super Admin", "permissions": ["*"]},
        {"key": "admin", "name_ar": "مدير", "name_en": "Admin",
         "permissions": ["publications.*", "responses.*", "users.read", "settings.read"]},
        {"key": "editor", "name_ar": "محرر", "name_en": "Editor",
         "permissions": ["publications.create", "publications.edit"]},
        {"key": "reviewer", "name_ar": "مراجع", "name_en": "Reviewer",
         "permissions": ["responses.moderate", "publications.review"]},
        {"key": "registered", "name_ar": "مستخدم مسجل", "name_en": "Registered User",
         "permissions": ["responses.submit"]},
    ]
    for r in default_roles:
        r["id"] = r.get("id") or str(uuid.uuid4())
        r["created_at"] = utc_iso()
        await db.roles.update_one({"key": r["key"]}, {"$setOnInsert": r}, upsert=True)

    # Super Admin user
    await db.users.create_index("email", unique=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@lizam.sa").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Lizam@2026")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "LIZAM Super Admin",
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "role": "super_admin",
            "status": "active",
            "auth_provider": "local",
            "created_at": utc_iso(),
            "updated_at": utc_iso(),
        })
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password),
                      "role": "super_admin", "updated_at": utc_iso()}},
        )

    # Site settings singleton
    site_defaults = {
        "id": "site",
        "site_name_ar": "مركز لزام للدراسات القانونية",
        "site_name_en": "LIZAM Center for Legal Research",
        "tagline_ar": "مركز بحثي متخصص في الدراسات القانونية والسياسات العامة",
        "tagline_en": "A research center specializing in legal studies and public policy",
        "default_language": "ar",
        "logo_url": "/brand/lizam-logo.png",
        "logo_light_url": "/brand/lizam-logo-light.png",
        "favicon_url": "/favicon.ico",
        "primary_color": "#23324D",
        "secondary_color": "#121A2A",
        "accent_color": "#B89B5E",
        "background_color": "#F7F8FA",
        "font_ar": "Thmanyah Sans",
        "font_en": "Thmanyah Sans",
        "contact_email": "info@lizam.sa",
        "phone": "",
        "address_ar": "المملكة العربية السعودية",
        "address_en": "Kingdom of Saudi Arabia",
        "footer_text_ar": "© {year} مركز لزام للدراسات القانونية. جميع الحقوق محفوظة.",
        "footer_text_en": "© {year} LIZAM Center for Legal Research. All rights reserved.",
        "social_links": SocialLinks().model_dump(),
        "feature_toggles": FeatureToggles().model_dump(),
        "updated_at": utc_iso(),
    }
    # NOTE: Phase 2 — we refresh content on every restart until Phase 3 CMS adds
    # an admin-edited flag. This keeps seed aligned with the latest PRD copy.
    await db.site_settings.update_one(
        {"id": "site"},
        {"$set": site_defaults},
        upsert=True,
    )

    # Home content singleton — refreshed from PRD copy
    home_defaults = {
        "id": "home",
        "hero_eyebrow_ar": "المجلد الأول · إصدار 2026",
        "hero_eyebrow_en": "Volume I · Edition 2026",
        "hero_title_ar": "بحث قانوني رصين\nلصناعة قرار أكثر نضجاً",
        "hero_title_en": "Rigorous Legal Research\nfor Sharper Decisions",
        "hero_subtitle_ar": (
            "مركز لزام للدراسات القانونية مركز بحثي سعودي متخصص في الدراسات القانونية والسياسات العامة، "
            "ينتج معرفة قانونية مستقلة تخدم القطاعين العام والخاص، وتدعم صنّاع القرار برؤى تحليلية موثوقة."
        ),
        "hero_subtitle_en": (
            "LIZAM Center for Legal Research is a Saudi research center specializing in legal studies and public policy, "
            "producing independent legal knowledge that serves the public and private sectors and supports decision-makers with trusted analytical insights."
        ),
        "hero_cta_primary_ar": "استعراض الإصدارات",
        "hero_cta_primary_en": "Explore Publications",
        "hero_cta_secondary_ar": "تواصل مع المركز",
        "hero_cta_secondary_en": "Contact the Center",
        "about_ar": (
            "مركز لزام للدراسات القانونية مركز بحثي سعودي يُعنى بتطوير البحث القانوني الرصين، "
            "وإنتاج دراسات وتحليلات قانونية ذات صلة بالسياسات العامة والحوكمة والممارسة المؤسسية، "
            "بما يخدم احتياجات القطاعين العام والخاص، ويسهم في إثراء المعرفة القانونية في المملكة العربية السعودية."
        ),
        "about_en": (
            "LIZAM Center for Legal Research is a Saudi research center dedicated to advancing rigorous legal research "
            "and producing studies and analyses relevant to public policy, governance, and institutional practice — "
            "serving the needs of the public and private sectors and enriching legal knowledge in the Kingdom of Saudi Arabia."
        ),
        "about_extended_ar": (
            "ينطلق مركز لزام من الإيمان بأن البحث القانوني الموثوق يتطلب استقلالًا فكريًا، ومنهجية صارمة، "
            "وفهمًا دقيقًا للسياقات النظامية والمؤسسية. ويعمل المركز على إنتاج دراسات قانونية وتحليلات بحثية "
            "ومخرجات استشارية تساعد المؤسسات وصنّاع القرار على فهم القضايا القانونية والتنظيمية المعقدة، "
            "من منظور يجمع بين الأصالة القانونية، والتحليل المقارن، والارتباط بالسياق السعودي."
        ),
        "about_extended_en": (
            "LIZAM is founded on the belief that credible legal research requires intellectual independence, "
            "methodological rigour, and a precise understanding of regulatory and institutional contexts. "
            "The Center produces legal studies, research analyses, and advisory outputs that help institutions "
            "and decision-makers navigate complex legal and regulatory questions — blending legal authenticity, "
            "comparative analysis, and grounding in the Saudi context."
        ),
        "mission_ar": (
            "تتمثل رسالة مركز لزام في الارتقاء بالبحث القانوني في المملكة العربية السعودية من خلال إنتاج "
            "دراسات قانونية رصينة وأصيلة وذات صلة بالسياسات العامة، تسهم في تطوير القانون والمؤسسات "
            "القانونية وممارسات الحوكمة في القطاعين العام والخاص."
        ),
        "mission_en": (
            "To advance legal research in the Kingdom of Saudi Arabia by producing rigorous, original, and "
            "policy-relevant legal studies that contribute to the development of law, legal institutions, "
            "and governance practice across the public and private sectors."
        ),
        "mission_points_ar": [
            "تعزيز جودة وعمق البحوث القانونية المتعلقة بالأنظمة والمؤسسات القانونية السعودية.",
            "تجسير الفجوة بين الدراسات القانونية الأكاديمية والممارسة المؤسسية.",
            "تقديم مخرجات بحثية واستشارية قائمة على التحليل الرصين للجهات الحكومية والكيانات الخاصة وجمعيات القطاع غير الربحي.",
            "ترسيخ ثقافة بحثية تقوم على المنهجية الصارمة، والاستقلال الفكري، والتبادل المعرفي المفتوح.",
        ],
        "mission_points_en": [
            "Elevate the quality and depth of legal research on Saudi legal systems and institutions.",
            "Bridge the gap between academic legal scholarship and institutional practice.",
            "Deliver rigorous research and advisory outputs for government, private, and non-profit entities.",
            "Establish a research culture grounded in methodological rigour, intellectual independence, and open exchange.",
        ],
        "vision_ar": (
            "تتمثل رؤية مركز لزام في أن يكون مؤسسة بحثية قانونية رائدة في المملكة العربية السعودية، "
            "معترفًا بجديّة طرحها الفكري وعمقها التحليلي، ومساهمتها المستدامة في الفكر القانوني "
            "وصياغة السياسات والتطوير المؤسسي."
        ),
        "vision_en": (
            "To be a leading legal research institution in the Kingdom of Saudi Arabia — recognised for the seriousness "
            "of its scholarship, the depth of its analysis, and its sustained contribution to legal thought, policy-making, "
            "and institutional development."
        ),
        "vision_points_ar": [
            "أن يكون مرجعًا موثوقًا للبحوث القانونية وتحليل السياسات ذات الصلة بالمملكة العربية السعودية.",
            "المساهمة في الحوارات الإقليمية والعالمية حول القانون والحوكمة والإصلاح القانوني من منظور بحثي سعودي.",
            "إعداد جيل جديد من الباحثين القانونيين السعوديين المؤهلين للتعامل مع القضايا القانونية والمؤسسية المعقدة.",
            "تقديم نموذج بحثي واستشاري قانوني قائم على المنهجية السليمة والمعاصرة، ومحقق لأثر مؤسسي طويل الأمد.",
        ],
        "vision_points_en": [
            "Serve as a trusted reference for legal research and policy analysis relevant to the Kingdom of Saudi Arabia.",
            "Contribute to regional and global conversations on law, governance, and legal reform from a Saudi research perspective.",
            "Prepare a new generation of Saudi legal researchers equipped for complex legal and institutional questions.",
            "Offer a contemporary research and advisory model rooted in sound methodology and delivering sustained institutional impact.",
        ],
        "objectives": [
            {
                "id": str(uuid.uuid4()), "sort_order": 1,
                "title_ar": "النهوض بالدراسات القانونية",
                "title_en": "Advancing Legal Studies",
                "description_ar": "إنتاج بحوث قانونية عالية الجودة تعالج القضايا الفقهية والمؤسسية والنظرية ذات الصلة بالقانون والحوكمة في المملكة.",
                "description_en": "Producing high-quality legal research on jurisprudential, institutional, and theoretical questions relevant to law and governance in the Kingdom.",
                "points_ar": [
                    "تشجيع الدراسات الأصيلة التي تقدم أطرًا تحليلية جديدة أو قراءات تاريخية أو رؤى مقارنة.",
                    "دعم المشروعات البحثية طويلة المدى، بما في ذلك دراسات السياسات وأوراق العمل والبحوث الأكاديمية.",
                ],
                "points_en": [
                    "Encouraging original studies that offer new analytical frameworks, historical readings, or comparative insights.",
                    "Supporting long-horizon research projects — policy studies, working papers, and academic research.",
                ],
            },
            {
                "id": str(uuid.uuid4()), "sort_order": 2,
                "title_ar": "دعم حوكمة القطاع العام",
                "title_en": "Supporting Public Sector Governance",
                "description_ar": "تقديم تحليلات قائمة على البحث للمؤسسات العامة في قضايا التشريع والتنظيم والصلاحيات المؤسسية والتصميم الإداري.",
                "description_en": "Providing research-grounded analysis to public institutions on legislation, regulation, institutional mandates, and administrative design.",
                "points_ar": [
                    "المساهمة في مداولات السياسات العامة من خلال دراسات محايدة ومستندة إلى التحليل القانوني العميق.",
                    "توضيح المفاهيم القانونية والمهام المؤسسية والقيود المعيارية ذات الصلة بصنع القرار العام.",
                ],
                "points_en": [
                    "Contributing to public policy deliberation with independent studies grounded in deep legal analysis.",
                    "Clarifying legal concepts, institutional mandates, and normative constraints relevant to public decision-making.",
                ],
            },
            {
                "id": str(uuid.uuid4()), "sort_order": 3,
                "title_ar": "خدمة القطاع الخاص",
                "title_en": "Serving the Private Sector",
                "description_ar": "تقديم خدمات بحثية واستشارية تساعد الكيانات الخاصة على فهم الأطر التنظيمية والمخاطر القانونية والتوقعات المؤسسية.",
                "description_en": "Research and advisory services that help private entities navigate regulatory frameworks, legal risks, and institutional expectations.",
                "points_ar": [
                    "ترجمة التطورات القانونية المعقدة إلى مخرجات تحليلية منظمة يسهل استيعابها من قبل غير المتخصصين أكاديميًا.",
                    "دعم الامتثال والحوكمة والتخطيط القانوني الاستراتيجي من خلال رؤى مستمدة من البحث.",
                ],
                "points_en": [
                    "Translating complex legal developments into structured analytical outputs accessible beyond academia.",
                    "Supporting compliance, governance, and strategic legal planning with research-driven insights.",
                ],
            },
            {
                "id": str(uuid.uuid4()), "sort_order": 4,
                "title_ar": "بناء القدرات البحثية",
                "title_en": "Building Research Capabilities",
                "description_ar": "توجيه الباحثين والممارسين في بداية مسيرتهم المهنية المهتمين بالبحث القانوني المتقدم.",
                "description_en": "Mentoring early-career researchers and practitioners engaged with advanced legal research.",
                "points_ar": [
                    "تسهيل المشروعات البحثية التعاونية بين الأكاديميين والممارسين والجهات المؤسسية.",
                    "تعزيز أخلاقيات البحث والشفافية المنهجية والضبط العلمي.",
                ],
                "points_en": [
                    "Facilitating collaborative projects between academics, practitioners, and institutional stakeholders.",
                    "Advancing research ethics, methodological transparency, and scholarly rigour.",
                ],
            },
            {
                "id": str(uuid.uuid4()), "sort_order": 5,
                "title_ar": "تعزيز المعرفة المتاحة للجميع",
                "title_en": "Promoting Open Access to Knowledge",
                "description_ar": "نشر المخرجات البحثية غير التكليفية وإتاحتها للجمهور مجانًا.",
                "description_en": "Publishing non-commissioned research outputs and making them freely accessible to the public.",
                "points_ar": [
                    "المساهمة في إثراء النقاش العام حول المسائل القانونية والسياسات العامة.",
                    "تشجيع تداول الأفكار بين الأوساط الأكاديمية والمهنية وصنّاع القرار.",
                ],
                "points_en": [
                    "Enriching public debate on legal and policy questions.",
                    "Encouraging the circulation of ideas across academic, professional, and decision-making communities.",
                ],
            },
        ],
        "fields_of_work": [
            {
                "id": str(uuid.uuid4()), "sort_order": 1, "icon": "scroll-text", "active": True,
                "title_ar": "الدراسات التشريعية",
                "title_en": "Legislative Studies",
                "description_ar": "تصميم الأنظمة واللوائح وصياغتها، وضمان الاتساق التشريعي، وقياس الأثر التشريعي.",
                "description_en": "The design and drafting of laws and regulations, legislative coherence, and measuring regulatory impact.",
            },
            {
                "id": str(uuid.uuid4()), "sort_order": 2, "icon": "scale", "active": True,
                "title_ar": "الممارسات القضائية والتاريخ المؤسسي",
                "title_en": "Judicial Practices & Institutional History",
                "description_ar": "دراسة التطور التاريخي للمؤسسات القانونية، والتسبيب القضائي، وتطوير آليات فض المنازعات.",
                "description_en": "Studying the historical evolution of legal institutions, judicial reasoning, and the development of dispute resolution mechanisms.",
            },
            {
                "id": str(uuid.uuid4()), "sort_order": 3, "icon": "landmark", "active": True,
                "title_ar": "السياسات العامة والحوكمة",
                "title_en": "Public Policy & Governance",
                "description_ar": "تحليل تصميم السياسات العامة وصياغتها، ودراسة التفاعل بين القانون والسياسة العامة، والأبعاد القانونية للتنمية الاقتصادية والإصلاح المؤسسي.",
                "description_en": "Analysing policy design, the interaction between law and public policy, and the legal dimensions of economic development and institutional reform.",
            },
            {
                "id": str(uuid.uuid4()), "sort_order": 4, "icon": "book-open", "active": True,
                "title_ar": "الشريعة الإسلامية والنظم القانونية",
                "title_en": "Islamic Sharia & Legal Systems",
                "description_ar": "التحليل الفقهي في السياقات المعاصرة، ودراسة التفاعل بين الفقه والنظم القانونية الحديثة، وآثار الاستنباطات الفقهية الحديثة.",
                "description_en": "Fiqh analysis in contemporary contexts, the interplay between Islamic jurisprudence and modern legal systems, and the implications of contemporary jurisprudential reasoning.",
            },
            {
                "id": str(uuid.uuid4()), "sort_order": 5, "icon": "compass", "active": True,
                "title_ar": "المجالات المتخصصة والناشئة",
                "title_en": "Specialised & Emerging Fields",
                "description_ar": "القانون والتقنية، المرافق العامة الإلكترونية، الحوكمة الرقمية، والجوانب القانونية للاستدامة.",
                "description_en": "Law and technology, e-public utilities, digital governance, and the legal dimensions of sustainability.",
            },
        ],
        "visible_sections": ["hero", "about", "mission", "vision", "objectives",
                             "fields_of_work", "featured_publications", "contact"],
        "updated_at": utc_iso(),
    }
    await db.home_content.update_one({"id": "home"}, {"$set": home_defaults}, upsert=True)

    # Categories (fields of work as categories)
    await db.categories.create_index("id", unique=True)
    for f in DEFAULT_FIELDS:
        doc = {
            "id": f["id"],
            "title_ar": f["title_ar"], "title_en": f["title_en"],
            "description_ar": f["description_ar"], "description_en": f["description_en"],
            "icon": f["icon"], "sort_order": f["sort_order"], "active": True,
        }
        await db.categories.update_one({"id": f["id"]}, {"$setOnInsert": doc}, upsert=True)

    # Authors
    await db.authors.create_index("id", unique=True)
    seed_authors = [
        {"id": str(uuid.uuid4()), "name_ar": "د. عبدالله الحارثي", "name_en": "Dr. Abdullah Al-Harithi",
         "title_ar": "باحث أول", "title_en": "Senior Researcher",
         "bio_ar": "باحث قانوني متخصص في الدراسات التشريعية والحوكمة.",
         "bio_en": "Legal researcher specialising in legislative studies and governance.",
         "active": True, "created_at": utc_iso()},
        {"id": str(uuid.uuid4()), "name_ar": "أ. ريم القحطاني", "name_en": "Ms. Reem Al-Qahtani",
         "title_ar": "باحثة في السياسات العامة", "title_en": "Public Policy Researcher",
         "bio_ar": "متخصصة في تحليل السياسات العامة وأثرها التنظيمي.",
         "bio_en": "Specialist in public policy analysis and its regulatory impact.",
         "active": True, "created_at": utc_iso()},
    ]
    for a in seed_authors:
        await db.authors.update_one({"name_en": a["name_en"]}, {"$setOnInsert": a}, upsert=True)

    # Publications
    await db.publications.create_index("id", unique=True)
    await db.publications.create_index([("slug_ar", 1)], unique=True, sparse=True)
    await db.publications.create_index([("slug_en", 1)], unique=True, sparse=True)
    await db.publications.create_index([("status", 1), ("published_at", -1)])
    cats = await db.categories.find({}, {"_id": 0, "id": 1}).to_list(length=10)
    authors_list = await db.authors.find({}, {"_id": 0, "id": 1}).to_list(length=10)

    def build_html_ar(pub):
        return f"""
<h2>ملخص الدراسة</h2>
<p>{pub['summary_ar']}</p>
<h2>المقدمة</h2>
<p>تتناول هذه الدراسة مسألة جوهرية من مسائل القانون والحوكمة في المملكة العربية السعودية،
وتقدّم قراءة تحليلية معمّقة تستند إلى منهجية بحثية صارمة ومراجعة للمصادر النظامية
والمؤسسية ذات الصلة.</p>
<h2>الإطار المنهجي</h2>
<p>اعتمدت الدراسة على منهج مختلط يجمع بين التحليل القانوني المقارن والمراجعة المنهجية
للوثائق الرسمية. استُخدمت مصادر تشريعية وقضائية وتقارير مؤسسية، إلى جانب مقارنة مع
تجارب دولية ذات صلة.</p>
<h2>النتائج الرئيسية</h2>
<ul>
  <li>رصد اتجاهات واضحة في تطوّر الإطار التنظيمي محل الدراسة.</li>
  <li>تحديد الفجوات المؤسسية التي تحتاج إلى معالجة تشريعية.</li>
  <li>صياغة توصيات قابلة للتطبيق تخدم صانع القرار.</li>
</ul>
<blockquote>لا يمكن إعادة بناء المؤسسات القانونية دون فهم دقيق لسياقها النظامي والمعرفي.</blockquote>
<h2>التوصيات</h2>
<p>تقترح الدراسة جملة من التوصيات التنظيمية والمؤسسية بهدف رفع كفاءة البيئة التشريعية
وتعزيز الاتساق بين الأطر القانونية القائمة.</p>
<h3>التوصيات التشريعية</h3>
<p>مراجعة شاملة للنصوص القائمة وضمان انسجامها مع الأهداف الاستراتيجية ذات الصلة.</p>
<h3>التوصيات المؤسسية</h3>
<p>تطوير الأدوار المؤسسية وتوضيح الصلاحيات بما يخدم جودة التطبيق والحوكمة.</p>
<h2>الخاتمة</h2>
<p>تخلص الدراسة إلى أن المعالجة المتوازنة بين الأبعاد القانونية والمؤسسية هي الطريق
الأنجع لتحقيق أثر مستدام.</p>
""".strip()

    def build_html_en(pub):
        return f"""
<h2>Abstract</h2>
<p>{pub['summary_en']}</p>
<h2>Introduction</h2>
<p>This study addresses a core question of law and governance in the Kingdom of Saudi Arabia
through an analytical reading grounded in rigorous methodology and review of the relevant
regulatory and institutional sources.</p>
<h2>Methodology</h2>
<p>The study adopts a mixed-methods approach combining comparative legal analysis with a
systematic review of official documentation, drawing on legislative, judicial, and
institutional sources alongside relevant international comparisons.</p>
<h2>Key findings</h2>
<ul>
  <li>Identifies clear trends in the evolution of the regulatory framework under study.</li>
  <li>Maps institutional gaps that call for legislative attention.</li>
  <li>Proposes actionable recommendations for decision-makers.</li>
</ul>
<blockquote>Legal institutions cannot be rebuilt without a precise understanding of their regulatory and epistemic context.</blockquote>
<h2>Recommendations</h2>
<p>The study proposes a set of regulatory and institutional recommendations aimed at
raising the efficiency of the legislative environment and strengthening coherence
across existing legal frameworks.</p>
<h3>Legislative recommendations</h3>
<p>A comprehensive review of existing texts and alignment with relevant strategic objectives.</p>
<h3>Institutional recommendations</h3>
<p>Clarifying institutional roles and mandates in ways that strengthen application quality and governance.</p>
<h2>Conclusion</h2>
<p>The study concludes that a balanced treatment of legal and institutional dimensions
is the most effective path to sustained impact.</p>
""".strip()

    # Always refresh publication content to latest (seed until CMS in Phase 3)
    for i, pub in enumerate(SEED_PUBLICATIONS):
        slug = f"lizam-pub-{i+1}"
        existing = await db.publications.find_one({"slug_en": slug})
        doc = {
            "title_ar": pub["title_ar"], "title_en": pub["title_en"],
            "slug_ar": slug, "slug_en": slug,
            "summary_ar": pub["summary_ar"], "summary_en": pub["summary_en"],
            "content_html_ar": build_html_ar(pub),
            "content_html_en": build_html_en(pub),
            "preview_html_ar": f"<p>{pub['summary_ar']}</p><p>تعرض الدراسة إطاراً تحليلياً متكاملاً يستعرض الخلفية النظرية والسياق المؤسسي قبل عرض النتائج والتوصيات…</p>",
            "preview_html_en": f"<p>{pub['summary_en']}</p><p>The study develops an integrated analytical framework — covering the theoretical background and institutional context before presenting the findings and recommendations…</p>",
            "publication_type": pub["publication_type"],
            "category_id": (cats[i % len(cats)]["id"] if cats else None),
            "author_ids": ([authors_list[i % len(authors_list)]["id"]] if authors_list else []),
            "cover_image_url": "", "pdf_file_url": "", "external_pdf_url": "https://example.com/lizam-sample.pdf",
            "access_level": pub["access_level"],
            "pdf_access_level": "public" if pub["access_level"] == "public" else "login_required",
            "responses_enabled": True, "featured": pub["featured"],
            "status": pub["status"],
            "published_at": existing.get("published_at") if existing else utc_iso(),
            "updated_at": utc_iso(),
            "view_count": existing.get("view_count") if existing else pub["view_count"],
            "reading_time_minutes": pub["reading_time_minutes"],
            "tags": pub["tags"], "related_publication_ids": [],
            "created_by": admin_email, "updated_by": admin_email,
            "created_at": existing.get("created_at") if existing else utc_iso(),
        }
        if not existing:
            doc["id"] = str(uuid.uuid4())
        await db.publications.update_one({"slug_en": slug}, {"$set": doc}, upsert=True)

    logger.info("Seed complete")


@app.on_event("startup")
async def on_startup():
    try:
        await seed_on_startup()
    except Exception as e:  # noqa: BLE001
        logger.exception("Seeding failed: %s", e)


@app.on_event("shutdown")
async def on_shutdown():
    client.close()

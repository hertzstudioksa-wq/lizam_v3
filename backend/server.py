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
):
    q: dict[str, Any] = {"status": "published"}
    if featured is not None:
        q["featured"] = featured
    if category:
        q["category_id"] = category
    if pub_type:
        q["publication_type"] = pub_type
    cursor = (
        db.publications.find(q, {"_id": 0, "content_html_ar": 0, "content_html_en": 0})
        .sort("published_at", -1)
        .skip(offset)
        .limit(limit)
    )
    items = await cursor.to_list(length=limit)
    total = await db.publications.count_documents(q)
    return {"items": items, "total": total, "limit": limit, "offset": offset}


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
        "tagline_ar": "منصة بحثية متخصصة في الدراسات والسياسات القانونية",
        "tagline_en": "A specialised research platform in legal studies and policy",
        "default_language": "ar",
        "logo_url": "/brand/lizam-logo.png",
        "logo_light_url": "/brand/lizam-logo-light.png",
        "favicon_url": "/favicon.ico",
        "primary_color": "#23324D",
        "secondary_color": "#121A2A",
        "accent_color": "#B89B5E",
        "background_color": "#F7F8FA",
        "font_ar": "IBM Plex Sans Arabic",
        "font_en": "Inter",
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
    await db.site_settings.update_one({"id": "site"}, {"$setOnInsert": site_defaults}, upsert=True)

    # Home content singleton
    home_defaults = {
        "id": "home",
        "hero_eyebrow_ar": "المجلد الأول · إصدار 2026",
        "hero_eyebrow_en": "Volume I · Edition 2026",
        "hero_title_ar": "بحث قانوني رصين\nلصناعة قرار أكثر نضجاً",
        "hero_title_en": "Rigorous Legal Research\nfor Sharper Decisions",
        "hero_subtitle_ar": (
            "مركز لزام مؤسسة بحثية سعودية متخصصة في الدراسات القانونية والسياسات العامة، "
            "تُنتج محتوىً علمياً مستقلاً يخدم القطاعين العام والخاص ويرفد صنّاع القرار."
        ),
        "hero_subtitle_en": (
            "LIZAM is a Saudi research center specialising in legal studies and public policy, "
            "producing independent scholarship that serves the public and private sectors and informs decision-makers."
        ),
        "hero_cta_primary_ar": "استعراض الإصدارات",
        "hero_cta_primary_en": "Explore Publications",
        "hero_cta_secondary_ar": "تواصل مع المركز",
        "hero_cta_secondary_en": "Contact the Center",
        "about_ar": (
            "مركز لزام للدراسات القانونية مؤسسة بحثية مستقلة، تأسست لتكون مرجعاً علمياً موثوقاً "
            "في حقول الدراسات التشريعية، والممارسات القضائية، والسياسات العامة، والشريعة الإسلامية، "
            "والمجالات القانونية الناشئة. نعمل على إثراء المكتبة القانونية العربية بأبحاث ودراسات "
            "رصينة، ونسهم في تطوير البيئة البحثية من خلال الشراكات والمبادرات المعرفية."
        ),
        "about_en": (
            "LIZAM Center for Legal Research is an independent research institution founded to serve "
            "as a trusted scholarly reference in legislative studies, judicial practices, public policy, "
            "Islamic jurisprudence, and emerging legal fields. We enrich the Arabic legal library with "
            "rigorous studies and contribute to shaping the research ecosystem through partnerships and initiatives."
        ),
        "mission_ar": "إنتاج دراسات وبحوث قانونية رصينة، وتقديم تحليلات علمية مستقلة تخدم المنظومة التشريعية والممارسة القانونية.",
        "mission_en": "To produce rigorous legal studies and independent analysis that serve the legislative framework and legal practice.",
        "vision_ar": "أن يكون المركز مرجعاً علمياً موثوقاً في الدراسات القانونية، ومساهماً فاعلاً في بناء المعرفة القانونية المعاصرة.",
        "vision_en": "To be a trusted reference in legal research and an active contributor to contemporary legal knowledge.",
        "objectives": DEFAULT_OBJECTIVES,
        "fields_of_work": DEFAULT_FIELDS,
        "visible_sections": ["hero", "about", "mission", "vision", "objectives",
                             "fields_of_work", "featured_publications", "contact"],
        "updated_at": utc_iso(),
    }
    await db.home_content.update_one({"id": "home"}, {"$setOnInsert": home_defaults}, upsert=True)

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
    existing_pubs = await db.publications.count_documents({})
    if existing_pubs == 0 and cats and authors_list:
        for i, pub in enumerate(SEED_PUBLICATIONS):
            doc = {
                "id": str(uuid.uuid4()),
                "title_ar": pub["title_ar"], "title_en": pub["title_en"],
                "slug_ar": f"lizam-pub-{i+1}", "slug_en": f"lizam-pub-{i+1}",
                "summary_ar": pub["summary_ar"], "summary_en": pub["summary_en"],
                "content_html_ar": f"<p>{pub['summary_ar']}</p>",
                "content_html_en": f"<p>{pub['summary_en']}</p>",
                "preview_html_ar": f"<p>{pub['summary_ar']}</p>",
                "preview_html_en": f"<p>{pub['summary_en']}</p>",
                "publication_type": pub["publication_type"],
                "category_id": cats[i % len(cats)]["id"],
                "author_ids": [authors_list[i % len(authors_list)]["id"]],
                "cover_image_url": "", "pdf_file_url": "", "external_pdf_url": "",
                "access_level": pub["access_level"],
                "pdf_access_level": "public",
                "responses_enabled": True, "featured": pub["featured"],
                "status": pub["status"],
                "published_at": utc_iso(), "updated_at": utc_iso(),
                "view_count": pub["view_count"],
                "reading_time_minutes": pub["reading_time_minutes"],
                "tags": pub["tags"], "related_publication_ids": [],
                "created_by": admin_email, "updated_by": admin_email,
                "created_at": utc_iso(),
            }
            await db.publications.update_one({"slug_en": doc["slug_en"]},
                                             {"$setOnInsert": doc}, upsert=True)

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

"""App configuration — env, DB client, constants."""
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@lizam.sa").lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Lizam@2026")

# Allowed frontend origins — tightened from the previous wildcard regex
ALLOWED_ORIGIN_REGEX = os.environ.get(
    "ALLOWED_ORIGIN_REGEX",
    r"^https://(.*\.preview\.emergentagent\.com|.*\.emergentagent\.com|localhost(:\d+)?)$",
)

# Upload paths
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
(UPLOAD_DIR / "images").mkdir(exist_ok=True)
(UPLOAD_DIR / "pdfs").mkdir(exist_ok=True)

MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "20"))
ALLOWED_IMAGE_MIME = {"image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"}
ALLOWED_PDF_MIME = {"application/pdf"}

SEED_ORIGIN = "system-seed"  # guard so CMS-edited content is not overwritten

# Roles that can access the admin area
ADMIN_ROLES = {"super_admin", "admin", "editor", "reviewer"}
# Roles that pass permission checks for a given key — see PERMISSIONS_MATRIX
PERMISSIONS_MATRIX = {
    # super_admin always wildcard
    "super_admin": {"*"},
    "admin": {
        "settings.read", "settings.edit",
        "branding.read", "branding.edit",
        "home.read", "home.edit",
        "publications.read", "publications.create", "publications.edit", "publications.publish", "publications.archive",
        "authors.read", "authors.create", "authors.edit", "authors.archive",
        "categories.read", "categories.create", "categories.edit", "categories.archive",
        "users.read", "users.edit",
        "roles.read",
        "responses.read", "responses.moderate",
        "toggles.read", "toggles.edit",
        "messages.read",
        "uploads.create",
        "audit.read",
    },
    "editor": {
        "settings.read", "branding.read", "home.read",
        "publications.read", "publications.create", "publications.edit",
        "authors.read", "authors.edit",
        "categories.read",
        "uploads.create",
    },
    "reviewer": {
        "publications.read", "responses.read", "responses.moderate",
    },
    "registered": {
        "responses.submit",
    },
}


def has_permission(role: str, key: str) -> bool:
    allowed = PERMISSIONS_MATRIX.get(role, set())
    if "*" in allowed:
        return True
    if key in allowed:
        return True
    # dot-prefix wildcard: 'publications.*' grants 'publications.create' etc.
    prefix = key.split(".")[0] + ".*"
    return prefix in allowed


# DB client (singleton)
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

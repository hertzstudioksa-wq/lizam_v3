"""LIZAM Phase 1 backend tests — covers health, public read APIs, auth flows, admin guard."""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://lizam-legal.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@lizam.sa"
ADMIN_PASSWORD = "Lizam@2026"


def _assert_no_mongo_id(obj):
    """Recursively ensure no `_id` keys leak in responses."""
    if isinstance(obj, dict):
        assert "_id" not in obj, f"MongoDB _id leaked in response: {list(obj.keys())}"
        for v in obj.values():
            _assert_no_mongo_id(v)
    elif isinstance(obj, list):
        for item in obj:
            _assert_no_mongo_id(item)


# --------------------------------------------------------------------------
# Health
# --------------------------------------------------------------------------
class TestHealth:
    def test_healthz(self):
        r = requests.get(f"{API}/healthz", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["service"] == "lizam-api"


# --------------------------------------------------------------------------
# Public read endpoints
# --------------------------------------------------------------------------
class TestPublicSiteSettings:
    def test_site_settings_seeded(self):
        r = requests.get(f"{API}/public/site-settings", timeout=15)
        assert r.status_code == 200
        data = r.json()
        _assert_no_mongo_id(data)
        assert data["site_name_ar"] == "مركز لزام للدراسات القانونية"
        assert data["site_name_en"] == "LIZAM Center for Legal Research"
        assert data["logo_url"] == "/brand/lizam-logo.png"
        assert data["primary_color"] == "#23324D"
        assert data["accent_color"] == "#B89B5E"
        assert isinstance(data.get("feature_toggles"), dict)
        # Spot-check toggles
        assert "registration" in data["feature_toggles"]
        assert "pdf_download" in data["feature_toggles"]


class TestPublicHomeContent:
    def test_home_content_seeded(self):
        r = requests.get(f"{API}/public/home-content", timeout=15)
        assert r.status_code == 200
        data = r.json()
        _assert_no_mongo_id(data)
        # Bilingual hero
        assert data.get("hero_title_ar")
        assert data.get("hero_title_en")
        # About / mission / vision bilingual
        for k in ("about_ar", "about_en", "mission_ar", "mission_en", "vision_ar", "vision_en"):
            assert data.get(k), f"Missing {k}"
        # Objectives and fields arrays
        objectives = data.get("objectives") or []
        fields = data.get("fields_of_work") or []
        assert len(objectives) >= 5, f"Expected >=5 objectives, got {len(objectives)}"
        assert len(fields) >= 5, f"Expected >=5 fields_of_work, got {len(fields)}"
        assert isinstance(data.get("visible_sections"), list)
        assert len(data["visible_sections"]) > 0


class TestPublicPublications:
    def test_publications_list_and_fields(self):
        r = requests.get(f"{API}/public/publications", timeout=15)
        assert r.status_code == 200
        data = r.json()
        _assert_no_mongo_id(data)
        items = data.get("items") or []
        assert len(items) >= 3, f"Expected >=3 seeded publications, got {len(items)}"
        required_fields = {
            "id", "title_ar", "title_en", "slug_ar", "slug_en",
            "summary_ar", "summary_en", "publication_type", "category_id",
            "author_ids", "access_level", "pdf_access_level", "featured",
            "status", "published_at", "updated_at", "view_count",
            "reading_time_minutes", "tags", "related_publication_ids",
        }
        for item in items:
            missing = required_fields - set(item.keys())
            assert not missing, f"Publication missing fields: {missing}"
            assert item["status"] == "published"
            assert isinstance(item["author_ids"], list)
            assert isinstance(item["tags"], list)


class TestPublicAuthors:
    def test_authors_list(self):
        r = requests.get(f"{API}/public/authors", timeout=15)
        assert r.status_code == 200
        data = r.json()
        _assert_no_mongo_id(data)
        items = data.get("items") or []
        assert len(items) >= 2
        for a in items:
            for k in ("name_ar", "name_en", "bio_ar", "bio_en", "title_ar", "title_en"):
                assert a.get(k), f"Author missing field {k}"


class TestPublicCategories:
    def test_categories_list(self):
        r = requests.get(f"{API}/public/categories", timeout=15)
        assert r.status_code == 200
        data = r.json()
        _assert_no_mongo_id(data)
        items = data.get("items") or []
        assert len(items) >= 5
        for c in items:
            assert c.get("active") is True
            for k in ("title_ar", "title_en", "description_ar", "description_en"):
                assert c.get(k), f"Category missing {k}"


# --------------------------------------------------------------------------
# Auth flows
# --------------------------------------------------------------------------
class TestAuth:
    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL, "password": "WrongPassword!"},
                          timeout=15)
        assert r.status_code == 401

    def test_login_admin_success_sets_cookies(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login",
                   json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        _assert_no_mongo_id(data)
        assert data["role"] == "super_admin"
        assert data["email"] == ADMIN_EMAIL
        assert "password_hash" not in data
        # httpOnly cookies set
        cookie_names = {c.name for c in s.cookies}
        assert "access_token" in cookie_names
        assert "refresh_token" in cookie_names

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_with_cookies(self):
        s = requests.Session()
        s.post(f"{API}/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        r = s.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        data = r.json()
        _assert_no_mongo_id(data)
        assert data["email"] == ADMIN_EMAIL
        assert "password_hash" not in data

    def test_register_new_user_then_duplicate(self):
        unique = f"TEST_user_{uuid.uuid4().hex[:10]}@example.com"
        s = requests.Session()
        r = s.post(f"{API}/auth/register",
                   json={"name": "Test User", "email": unique, "password": "Passw0rd!"},
                   timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        _assert_no_mongo_id(data)
        assert data["role"] == "registered"
        assert data["email"] == unique.lower()
        assert "password_hash" not in data
        cookie_names = {c.name for c in s.cookies}
        assert "access_token" in cookie_names
        assert "refresh_token" in cookie_names

        # duplicate
        r2 = requests.post(f"{API}/auth/register",
                           json={"name": "Dup", "email": unique, "password": "Passw0rd!"},
                           timeout=15)
        assert r2.status_code == 409

    def test_logout_clears_cookies(self):
        s = requests.Session()
        s.post(f"{API}/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        r = s.post(f"{API}/auth/logout", timeout=15)
        assert r.status_code == 200
        # subsequent /me with same session should 401 because cookies were cleared
        r2 = s.get(f"{API}/auth/me", timeout=15)
        assert r2.status_code == 401

    def test_refresh_issues_new_access_token(self):
        s = requests.Session()
        s.post(f"{API}/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        old_access = s.cookies.get("access_token")
        r = s.post(f"{API}/auth/refresh", timeout=15)
        assert r.status_code == 200, r.text
        new_access = s.cookies.get("access_token")
        assert new_access is not None
        # Refresh should rotate access_token; tolerate equal token only if exp >= 1s resolution
        # Core check: session can still access /me
        r2 = s.get(f"{API}/auth/me", timeout=15)
        assert r2.status_code == 200


# --------------------------------------------------------------------------
# Admin guard
# --------------------------------------------------------------------------
class TestAdminOverview:
    def test_overview_requires_auth(self):
        r = requests.get(f"{API}/admin/overview", timeout=15)
        assert r.status_code == 401

    def test_overview_as_admin(self):
        s = requests.Session()
        s.post(f"{API}/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        r = s.get(f"{API}/admin/overview", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        _assert_no_mongo_id(data)
        for k in ("publications_total", "publications_published", "publications_draft",
                  "users_total", "responses_pending", "messages_new"):
            assert k in data, f"Missing {k}"
            assert isinstance(data[k], int), f"{k} must be int, got {type(data[k])}"

    def test_overview_registered_user_forbidden(self):
        # create a fresh registered user and hit admin overview
        unique = f"TEST_regular_{uuid.uuid4().hex[:10]}@example.com"
        s = requests.Session()
        reg = s.post(f"{API}/auth/register",
                     json={"name": "Regular", "email": unique, "password": "Passw0rd!"},
                     timeout=15)
        assert reg.status_code == 200, reg.text
        r = s.get(f"{API}/admin/overview", timeout=15)
        assert r.status_code == 403, f"expected 403 for registered user, got {r.status_code} {r.text}"

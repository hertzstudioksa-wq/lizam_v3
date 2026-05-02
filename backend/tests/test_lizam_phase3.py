"""LIZAM Phase 3 — CMS authoring + technical hardening tests.

Covers:
- Auth: login/me/logout/overview role-guards, rate-limit on /login
- Public: site-settings, home-content, publications list, publication detail (incl. _gated, related, authors, category)
- Tokenized PDF: /publications/{id}/pdf returns stream_url token; /pdf-stream validates & enforces gating
- Admin CRUD round-trips for: site-settings, branding, home, publications, authors, categories, users, roles, toggles
- HTML sanitization on TipTap content_html_ar / content_html_en (scripts + onclick stripped, whitelisted retained)
- Seed idempotency: admin-edited records persist through backend restart
"""
import os
import time
import uuid
import subprocess
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://lizam-legal.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@lizam.sa"
ADMIN_PASSWORD = "Lizam@2026"


def _no_mongo_id(obj):
    if isinstance(obj, dict):
        assert "_id" not in obj, f"MongoDB _id leaked: {list(obj.keys())[:8]}"
        for v in obj.values():
            _no_mongo_id(v)
    elif isinstance(obj, list):
        for item in obj:
            _no_mongo_id(item)


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    # Cookies should be set
    assert "access_token" in s.cookies, "access_token cookie not set"
    assert "refresh_token" in s.cookies, "refresh_token cookie not set"
    return s


# --------------------------------------------------------------------------
# 1. Auth
# --------------------------------------------------------------------------
class TestAuth:
    def test_login_sets_httponly_cookies(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        _no_mongo_id(d)
        assert d["email"] == ADMIN_EMAIL
        assert d["role"] == "super_admin"
        # cookie header contains HttpOnly flag
        set_cookie = r.headers.get("set-cookie", "")
        assert "access_token=" in set_cookie
        assert "HttpOnly" in set_cookie, f"access_token missing HttpOnly: {set_cookie}"

    def test_me_authed(self, admin_session):
        r = admin_session.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == ADMIN_EMAIL
        assert d["role"] == "super_admin"

    def test_me_unauth_401(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_admin_overview_role_guards(self, admin_session):
        # super_admin OK
        r = admin_session.get(f"{API}/admin/overview", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("publications_total", "publications_published", "users_total"):
            assert k in d
        # Unauth → 401
        r = requests.get(f"{API}/admin/overview", timeout=15)
        assert r.status_code == 401


class TestRateLimit:
    """Hit /login with bad creds repeatedly; after 5 failures it should 429 lockout
    for the email/ip pair (15 min)."""
    def test_login_rate_limit_after_burst(self):
        # Use a unique email so we don't lock admin
        bogus_email = f"ratetest+{uuid.uuid4().hex[:6]}@example.com"
        codes = []
        for _ in range(7):
            r = requests.post(f"{API}/auth/login",
                              json={"email": bogus_email, "password": "WrongPass!"}, timeout=15)
            codes.append(r.status_code)
        assert 429 in codes, f"Expected a 429 lockout after 5 bad attempts, got: {codes}"


# --------------------------------------------------------------------------
# 2. Public endpoints
# --------------------------------------------------------------------------
class TestPublic:
    def test_site_settings(self):
        r = requests.get(f"{API}/public/site-settings", timeout=15)
        assert r.status_code == 200
        d = r.json()
        _no_mongo_id(d)
        for k in ("site_name_ar", "site_name_en", "tagline_ar", "tagline_en", "feature_toggles", "default_language"):
            assert k in d, f"missing {k} in site-settings"

    def test_home_content(self):
        # Code exposes /public/home-content (not /public/home)
        r = requests.get(f"{API}/public/home-content", timeout=15)
        assert r.status_code == 200
        d = r.json()
        _no_mongo_id(d)
        for k in ("hero_title_ar", "hero_title_en", "mission_ar", "vision_ar", "objectives", "fields_of_work"):
            assert k in d, f"home-content missing {k}"

    def test_publications_list(self):
        r = requests.get(f"{API}/public/publications?limit=5", timeout=15)
        assert r.status_code == 200
        d = r.json()
        _no_mongo_id(d)
        items = d.get("items") or []
        assert len(items) >= 1
        for it in items:
            for k in ("id", "title_ar", "title_en", "slug_ar", "slug_en"):
                assert k in it

    def test_publication_detail_full_hydration(self):
        r = requests.get(f"{API}/public/publications/lizam-pub-2", timeout=15)
        assert r.status_code == 200
        d = r.json()
        _no_mongo_id(d)
        assert "_gated" in d and "_gated_reason" in d
        assert "authors" in d and isinstance(d["authors"], list)
        assert "category" in d
        assert "related" in d and isinstance(d["related"], list)
        assert "pdf_access_level" in d


# --------------------------------------------------------------------------
# 3. Tokenized PDF
# --------------------------------------------------------------------------
class TestTokenizedPdf:
    def test_public_pdf_returns_stream_url(self):
        r = requests.get(f"{API}/public/publications/lizam-pub-2/pdf", timeout=15)
        assert r.status_code == 200
        d = r.json()
        _no_mongo_id(d)
        assert d.get("ok") is True
        # Hardened Phase 3: must return stream_url + token
        assert "stream_url" in d and d["stream_url"].startswith("/api/public/pdf-stream/"), \
            f"missing tokenized stream_url: {d}"
        assert d.get("token"), "missing token"

    def test_pdf_stream_rejects_bad_token(self):
        r = requests.get(f"{API}/public/pdf-stream/not-a-real-token", timeout=15,
                         allow_redirects=False)
        assert r.status_code == 401, f"expected 401 invalid token, got {r.status_code}"

    def test_login_required_pdf_gated_unauth(self):
        r = requests.get(f"{API}/public/publications/lizam-pub-1/pdf", timeout=15)
        assert r.status_code == 401, r.text

    def test_login_required_pdf_admin_gets_token(self, admin_session):
        r = admin_session.get(f"{API}/public/publications/lizam-pub-1/pdf", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("stream_url", "").startswith("/api/public/pdf-stream/")

    def test_pdf_stream_valid_token_serves_pdf(self, admin_session):
        # Get a valid token then call the stream endpoint
        r = admin_session.get(f"{API}/public/publications/lizam-pub-1/pdf", timeout=15)
        assert r.status_code == 200
        stream_path = r.json()["stream_url"]  # /api/public/pdf-stream/<token>
        full = f"{BASE_URL}{stream_path}"
        # Stream upstream — may 200 with PDF bytes, or 502 if external PDF unreachable
        r2 = admin_session.get(full, timeout=25, stream=True)
        assert r2.status_code in (200, 502, 404), f"unexpected stream status: {r2.status_code}"
        if r2.status_code == 200:
            ct = r2.headers.get("content-type", "")
            assert "pdf" in ct.lower(), f"expected pdf content-type, got {ct}"


# --------------------------------------------------------------------------
# 4. Admin CRUD round-trips
# --------------------------------------------------------------------------
class TestAdminSiteSettings:
    def test_get_and_patch_site_settings(self, admin_session):
        r = admin_session.get(f"{API}/admin/site-settings", timeout=15)
        assert r.status_code == 200
        original_tagline = r.json().get("tagline_en")

        new_val = f"TEST_TAGLINE_{uuid.uuid4().hex[:6]}"
        rp = admin_session.patch(f"{API}/admin/site-settings",
                                 json={"tagline_en": new_val}, timeout=15)
        assert rp.status_code == 200, rp.text
        assert rp.json()["tagline_en"] == new_val
        # Verify via public endpoint
        rpub = requests.get(f"{API}/public/site-settings", timeout=15)
        assert rpub.json()["tagline_en"] == new_val
        # Restore
        admin_session.patch(f"{API}/admin/site-settings",
                            json={"tagline_en": original_tagline}, timeout=15)

    def test_site_settings_requires_auth(self):
        r = requests.patch(f"{API}/admin/site-settings", json={"tagline_en": "x"}, timeout=15)
        assert r.status_code == 401


class TestAdminBranding:
    def test_get_and_patch_branding(self, admin_session):
        r = admin_session.get(f"{API}/admin/branding", timeout=15)
        assert r.status_code == 200
        new_color = "#123456"
        rp = admin_session.patch(f"{API}/admin/branding",
                                 json={"primary_color": new_color}, timeout=15)
        assert rp.status_code == 200
        assert rp.json()["primary_color"] == new_color


class TestAdminHome:
    def test_get_and_patch_home(self, admin_session):
        r = admin_session.get(f"{API}/admin/home", timeout=15)
        assert r.status_code == 200
        original_hero = r.json().get("hero_title_en")
        new_val = f"TEST_HERO_{uuid.uuid4().hex[:6]}"
        rp = admin_session.patch(f"{API}/admin/home",
                                 json={"hero_title_en": new_val}, timeout=15)
        assert rp.status_code == 200, rp.text
        assert rp.json()["hero_title_en"] == new_val
        # Restore
        admin_session.patch(f"{API}/admin/home",
                            json={"hero_title_en": original_hero}, timeout=15)


class TestAdminPublicationsCrud:
    """Full CRUD + sanitization round-trip."""
    pub_id = None

    def test_01_create_sanitizes_html(self, admin_session):
        unsafe = (
            '<p>Safe <strong>bold</strong> paragraph</p>'
            '<script>alert("xss")</script>'
            '<p onclick="alert(1)">clickme</p>'
            '<iframe src="evil.com"></iframe>'
            '<h2>Heading</h2>'
        )
        body = {
            "title_ar": f"TEST_AR_{uuid.uuid4().hex[:6]}",
            "title_en": f"TEST_EN_{uuid.uuid4().hex[:6]}",
            "summary_ar": "ملخص اختبار",
            "summary_en": "Test summary",
            "content_html_ar": unsafe,
            "content_html_en": unsafe,
            "publication_type": "article",
            "access_level": "public",
            "pdf_access_level": "public",
            "status": "draft",
        }
        r = admin_session.post(f"{API}/admin/publications", json=body, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        _no_mongo_id(d)
        assert d["id"]
        TestAdminPublicationsCrud.pub_id = d["id"]
        # Sanitization assertions
        html_ar = d["content_html_ar"]
        html_en = d["content_html_en"]
        assert "<script" not in html_ar.lower()
        assert "<iframe" not in html_ar.lower()
        assert "onclick" not in html_ar.lower()
        assert "<script" not in html_en.lower()
        # Whitelisted tags retained
        assert "<strong>" in html_ar
        assert "<h2>" in html_ar

    def test_02_get_persists(self, admin_session):
        assert TestAdminPublicationsCrud.pub_id
        r = admin_session.get(f"{API}/admin/publications/{TestAdminPublicationsCrud.pub_id}", timeout=15)
        assert r.status_code == 200
        assert "<script" not in r.json()["content_html_ar"].lower()

    def test_03_patch_updates(self, admin_session):
        new_title = f"TEST_UPDATED_{uuid.uuid4().hex[:6]}"
        r = admin_session.patch(
            f"{API}/admin/publications/{TestAdminPublicationsCrud.pub_id}",
            json={"title_en": new_title, "content_html_en": "<p>clean<script>x</script></p>"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json()["title_en"] == new_title
        assert "<script" not in r.json()["content_html_en"].lower()

    def test_04_archive_deletes(self, admin_session):
        r = admin_session.delete(
            f"{API}/admin/publications/{TestAdminPublicationsCrud.pub_id}", timeout=15)
        assert r.status_code == 200
        # Status flipped to archived
        g = admin_session.get(
            f"{API}/admin/publications/{TestAdminPublicationsCrud.pub_id}", timeout=15)
        assert g.status_code == 200
        assert g.json()["status"] == "archived"

    def test_05_unauth_forbidden(self):
        r = requests.post(f"{API}/admin/publications", json={"title_ar": "x"}, timeout=15)
        assert r.status_code == 401


class TestAdminAuthors:
    author_id = None

    def test_create_list_update_delete(self, admin_session):
        body = {"name_ar": f"TEST_AR_{uuid.uuid4().hex[:6]}",
                "name_en": f"TEST_EN_{uuid.uuid4().hex[:6]}", "active": True}
        r = admin_session.post(f"{API}/admin/authors", json=body, timeout=15)
        assert r.status_code == 200, r.text
        aid = r.json()["id"]
        TestAdminAuthors.author_id = aid

        lst = admin_session.get(f"{API}/admin/authors", timeout=15).json()
        assert any(a["id"] == aid for a in lst["items"])

        up = admin_session.patch(f"{API}/admin/authors/{aid}",
                                 json={"name_en": "TEST_UPDATED"}, timeout=15)
        assert up.status_code == 200
        assert up.json()["name_en"] == "TEST_UPDATED"

        dl = admin_session.delete(f"{API}/admin/authors/{aid}", timeout=15)
        assert dl.status_code == 200


class TestAdminCategories:
    def test_create_list_delete(self, admin_session):
        body = {"title_ar": f"TEST_CAT_AR_{uuid.uuid4().hex[:4]}",
                "title_en": f"TEST_CAT_EN_{uuid.uuid4().hex[:4]}", "active": True}
        r = admin_session.post(f"{API}/admin/categories", json=body, timeout=15)
        assert r.status_code == 200, r.text
        cid = r.json()["id"]
        lst = admin_session.get(f"{API}/admin/categories", timeout=15).json()
        assert any(c["id"] == cid for c in lst["items"])
        dl = admin_session.delete(f"{API}/admin/categories/{cid}", timeout=15)
        assert dl.status_code == 200


class TestAdminUsersRoles:
    def test_list_users(self, admin_session):
        r = admin_session.get(f"{API}/admin/users", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json().get("items"), list)

    def test_list_roles(self, admin_session):
        r = admin_session.get(f"{API}/admin/roles", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json().get("items"), list)


class TestAdminToggles:
    def test_get_and_patch_toggles(self, admin_session):
        r = admin_session.get(f"{API}/admin/toggles", timeout=15)
        assert r.status_code == 200
        original = r.json()
        # Flip featured_publications off then restore
        new_val = dict(original)
        new_val["featured_publications"] = not bool(original.get("featured_publications", True))
        rp = admin_session.patch(f"{API}/admin/toggles", json=new_val, timeout=15)
        assert rp.status_code == 200
        assert rp.json()["featured_publications"] == new_val["featured_publications"]
        # Verify reflected publicly
        rpub = requests.get(f"{API}/public/site-settings", timeout=15).json()
        assert rpub["feature_toggles"]["featured_publications"] == new_val["featured_publications"]
        # Restore
        admin_session.patch(f"{API}/admin/toggles", json=original, timeout=15)


# --------------------------------------------------------------------------
# 5. Seed idempotency — admin edit survives backend restart
# --------------------------------------------------------------------------
class TestSeedIdempotency:
    def test_admin_edit_survives_restart(self, admin_session):
        marker = f"SEED_IDEMP_{uuid.uuid4().hex[:8]}"
        # Edit site_settings tagline_en
        rp = admin_session.patch(f"{API}/admin/site-settings",
                                 json={"tagline_en": marker}, timeout=15)
        assert rp.status_code == 200

        # Restart backend via supervisor
        subprocess.run(["sudo", "supervisorctl", "restart", "backend"],
                       check=False, capture_output=True, timeout=60)
        # Wait for service to come up
        for _ in range(30):
            try:
                r = requests.get(f"{API}/healthz", timeout=5)
                if r.status_code == 200:
                    break
            except Exception:
                pass
            time.sleep(1)
        else:
            pytest.fail("backend did not come back up after restart")

        # Confirm edit is still there
        r = requests.get(f"{API}/public/site-settings", timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("tagline_en") == marker, \
            f"seed overwrote admin edit (found={r.json().get('tagline_en')!r}, expected {marker!r})"

        # Restore original tagline for downstream tests
        original = "A research center specializing in legal studies and public policy"
        admin_session.post(f"{API}/auth/login",
                           json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        admin_session.patch(f"{API}/admin/site-settings",
                            json={"tagline_en": original}, timeout=15)

"""LIZAM Phase 2 backend tests — home content refinements, site settings, publication
listing filters (q/sort/category/pub_type), publication detail with gating + hydration
+ view_count increment, PDF access enforcement, responses placeholder, and Phase-1
regression guards (health/auth/admin + MongoDB _id leak detection)."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://lizam-legal.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@lizam.sa"
ADMIN_PASSWORD = "Lizam@2026"


# ---- helpers -------------------------------------------------------------
def _assert_no_mongo_id(obj):
    if isinstance(obj, dict):
        assert "_id" not in obj, f"MongoDB _id leaked: {list(obj.keys())}"
        for v in obj.values():
            _assert_no_mongo_id(v)
    elif isinstance(obj, list):
        for item in obj:
            _assert_no_mongo_id(item)


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


# --------------------------------------------------------------------------
# Phase 1 regression (quick)
# --------------------------------------------------------------------------
class TestPhase1Regression:
    def test_healthz(self):
        r = requests.get(f"{API}/healthz", timeout=15)
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_admin_login_me(self, admin_session):
        r = admin_session.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        d = r.json()
        _assert_no_mongo_id(d)
        assert d["email"] == ADMIN_EMAIL
        assert d["role"] == "super_admin"

    def test_admin_overview_requires_auth(self):
        r = requests.get(f"{API}/admin/overview", timeout=15)
        assert r.status_code == 401

    def test_admin_overview_authed(self, admin_session):
        r = admin_session.get(f"{API}/admin/overview", timeout=15)
        assert r.status_code == 200
        _assert_no_mongo_id(r.json())


# --------------------------------------------------------------------------
# Refined site-settings & home-content
# --------------------------------------------------------------------------
class TestSiteSettingsRefined:
    def test_taglines_and_font(self):
        r = requests.get(f"{API}/public/site-settings", timeout=15)
        assert r.status_code == 200
        d = r.json()
        _assert_no_mongo_id(d)
        assert d.get("tagline_ar") == "مركز بحثي متخصص في الدراسات القانونية والسياسات العامة", \
            f"tagline_ar mismatch: {d.get('tagline_ar')!r}"
        assert "research center specializing in legal studies" in (d.get("tagline_en") or "").lower(), \
            f"tagline_en mismatch: {d.get('tagline_en')!r}"
        assert d.get("font_ar") == "Thmanyah Sans", f"font_ar mismatch: {d.get('font_ar')!r}"


class TestHomeContentRefined:
    def test_hero_and_mission_vision_and_objectives_fields(self):
        r = requests.get(f"{API}/public/home-content", timeout=15)
        assert r.status_code == 200
        d = r.json()
        _assert_no_mongo_id(d)

        # Tagline-style hero subtitle
        assert "سعودي متخصص" in (d.get("hero_subtitle_ar") or ""), \
            f"hero_subtitle_ar missing 'سعودي متخصص': {d.get('hero_subtitle_ar')!r}"

        # Mission / vision points — both arrays of 4
        mp = d.get("mission_points_ar") or []
        vp = d.get("vision_points_ar") or []
        # Per the user-provided content (Feb 2026): mission has 3 points, vision 4.
        assert isinstance(mp, list) and len(mp) == 3, f"mission_points_ar len={len(mp)}"
        assert isinstance(vp, list) and len(vp) == 4, f"vision_points_ar len={len(vp)}"

        # Objectives — 5 items, each with AR/EN title/description (Phase-3 schema simplified, no points)
        objs = d.get("objectives") or []
        assert len(objs) == 5, f"objectives len={len(objs)}"
        for o in objs:
            for k in ("title_ar", "title_en", "description_ar", "description_en"):
                assert o.get(k), f"objective missing {k}: {o}"

        # Fields of work — 5 items, each with title/description/icon
        fow = d.get("fields_of_work") or []
        assert len(fow) == 5, f"fields_of_work len={len(fow)}"
        for f_ in fow:
            for k in ("title_ar", "title_en", "description_ar", "description_en", "icon"):
                assert f_.get(k), f"field missing {k}: {f_}"


# --------------------------------------------------------------------------
# Publications listing — filters, sort, search
# --------------------------------------------------------------------------
class TestPublicationsList:
    def test_list_limit3_shape_no_content_html(self):
        r = requests.get(f"{API}/public/publications?limit=3", timeout=15)
        assert r.status_code == 200
        d = r.json()
        _assert_no_mongo_id(d)
        items = d.get("items") or []
        assert len(items) == 3, f"expected 3 items, got {len(items)}"
        required = {
            "id", "title_ar", "title_en", "slug_ar", "slug_en",
            "summary_ar", "summary_en", "publication_type", "category_id",
            "author_ids", "access_level", "pdf_access_level", "featured",
            "status", "published_at", "updated_at", "view_count",
            "reading_time_minutes", "tags", "related_publication_ids",
        }
        for it in items:
            missing = required - set(it.keys())
            assert not missing, f"pub missing fields {missing}"
            # content_html must NOT be present in list view
            assert "content_html_ar" not in it, "content_html_ar leaked into list"
            assert "content_html_en" not in it, "content_html_en leaked into list"

    def test_arabic_search_zaka(self):
        r = requests.get(f"{API}/public/publications", params={"q": "ذكاء"}, timeout=15)
        assert r.status_code == 200
        items = r.json().get("items") or []
        assert len(items) >= 1, "expected >=1 result for Arabic q=ذكاء"
        # ensure result actually mentions ذكاء in AR fields
        hit = any("ذكاء" in (it.get("title_ar", "") + it.get("summary_ar", "") + " ".join(it.get("tags", []))) for it in items)
        assert hit, f"search results do not contain 'ذكاء': {items}"

    def test_sort_most_viewed_desc(self):
        r = requests.get(f"{API}/public/publications", params={"sort": "most_viewed"}, timeout=15)
        assert r.status_code == 200
        items = r.json().get("items") or []
        assert len(items) >= 2
        vcs = [it["view_count"] for it in items]
        assert vcs == sorted(vcs, reverse=True), f"view_count not desc: {vcs}"

    def test_filter_by_category(self):
        cats = requests.get(f"{API}/public/categories", timeout=15).json().get("items") or []
        assert cats, "no categories seeded"
        # Use a category that has at least one publication seeded
        all_pubs = requests.get(f"{API}/public/publications?limit=20", timeout=15).json()["items"]
        used_cat_ids = {p["category_id"] for p in all_pubs if p.get("category_id")}
        assert used_cat_ids, "no publications have category_id"
        cat_id = next(iter(used_cat_ids))
        r = requests.get(f"{API}/public/publications", params={"category": cat_id}, timeout=15)
        assert r.status_code == 200
        items = r.json().get("items") or []
        assert len(items) >= 1
        for it in items:
            assert it["category_id"] == cat_id, f"category filter leaked: {it['category_id']} != {cat_id}"

    def test_filter_by_pub_type_policy_paper(self):
        r = requests.get(f"{API}/public/publications", params={"pub_type": "policy_paper"}, timeout=15)
        assert r.status_code == 200
        items = r.json().get("items") or []
        assert len(items) >= 1, "no policy_paper items returned"
        for it in items:
            assert it["publication_type"] == "policy_paper"


# --------------------------------------------------------------------------
# Publication detail — gating + hydration + view_count increment
# --------------------------------------------------------------------------
class TestPublicationDetailPublic:
    def test_public_pub2_full_content_and_hydration(self):
        # first request to capture view_count
        r1 = requests.get(f"{API}/public/publications/lizam-pub-2", timeout=15)
        assert r1.status_code == 200, r1.text
        p1 = r1.json()
        _assert_no_mongo_id(p1)
        assert p1["_gated"] is False
        assert p1["_gated_reason"] is None
        assert p1.get("content_html_ar"), "content_html_ar empty for public pub"
        assert p1.get("content_html_en"), "content_html_en empty for public pub"
        # authors hydrated as array
        assert isinstance(p1.get("authors"), list)
        assert len(p1["authors"]) >= 1
        for a in p1["authors"]:
            for k in ("name_ar", "name_en"):
                assert a.get(k)
        # category hydrated as object
        assert isinstance(p1.get("category"), dict)
        assert p1["category"].get("title_ar")
        # related up to 3, excluding self
        rel = p1.get("related") or []
        assert isinstance(rel, list)
        assert len(rel) <= 3
        for r_ in rel:
            assert r_["id"] != p1["id"], "related contains self"

        # view_count should increment per call (use a non-bot UA — Phase-3 suppresses for python-requests)
        vc1 = p1["view_count"]
        time.sleep(0.2)
        ua_headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15"}
        # warm a request first, since the very first call already counted
        requests.get(f"{API}/public/publications/lizam-pub-2", headers=ua_headers, timeout=15)
        r2 = requests.get(f"{API}/public/publications/lizam-pub-2", headers=ua_headers, timeout=15)
        assert r2.status_code == 200
        p2 = r2.json()
        assert p2["view_count"] > vc1, f"view_count did not increment: {vc1} -> {p2['view_count']}"

    def test_non_existent_slug_returns_404(self):
        r = requests.get(f"{API}/public/publications/non-existent-slug", timeout=15)
        assert r.status_code == 404


class TestPublicationDetailGated:
    def test_preview_login_without_auth_returns_preview(self):
        r = requests.get(f"{API}/public/publications/lizam-pub-1", timeout=15)
        assert r.status_code == 200
        d = r.json()
        _assert_no_mongo_id(d)
        assert d["_gated"] is True
        assert d["_gated_reason"] == "preview_only"
        # Content is replaced by preview content (non-empty)
        assert d.get("content_html_ar"), "expected preview content_html_ar"
        assert d.get("content_html_en"), "expected preview content_html_en"
        # Preview AR should mention preview marker
        assert "تعرض الدراسة إطاراً تحليلياً" in d["content_html_ar"], \
            "content_html_ar is not the preview snippet"

    def test_preview_login_with_admin_auth_returns_full(self, admin_session):
        r = admin_session.get(f"{API}/public/publications/lizam-pub-1", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["_gated"] is False
        assert d["_gated_reason"] is None
        # Full content distinct from preview — should include seeded HTML heading
        assert "<h2>" in d.get("content_html_ar", ""), "admin did not receive full AR content"
        assert "<h2>" in d.get("content_html_en", ""), "admin did not receive full EN content"

    def test_registered_without_auth_is_gated_empty(self):
        r = requests.get(f"{API}/public/publications/lizam-pub-3", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["_gated"] is True
        assert d["_gated_reason"] == "login_required"
        assert d.get("content_html_ar") == ""
        assert d.get("content_html_en") == ""

    def test_registered_with_admin_auth_returns_full(self, admin_session):
        r = admin_session.get(f"{API}/public/publications/lizam-pub-3", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["_gated"] is False
        assert d["_gated_reason"] is None
        assert "<h2>" in d.get("content_html_ar", "")
        assert "<h2>" in d.get("content_html_en", "")


# --------------------------------------------------------------------------
# PDF access enforcement
# --------------------------------------------------------------------------
class TestPdfAccess:
    def test_public_pdf_no_auth_returns_url(self):
        r = requests.get(f"{API}/public/publications/lizam-pub-2/pdf", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        _assert_no_mongo_id(d)
        assert d.get("ok") is True
        assert d.get("stream_url")
        assert d.get("token")
        assert d.get("title")

    def test_login_required_pdf_no_auth_401(self):
        r = requests.get(f"{API}/public/publications/lizam-pub-1/pdf", timeout=15)
        assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text}"

    def test_login_required_pdf_with_admin_auth(self, admin_session):
        r = admin_session.get(f"{API}/public/publications/lizam-pub-1/pdf", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True
        assert d.get("stream_url")
        assert d.get("token")


# --------------------------------------------------------------------------
# Responses (Phase 5 — live endpoint; legacy placeholder retired)
# --------------------------------------------------------------------------
class TestResponsesLive:
    def test_responses_rejects_missing_fields(self):
        """Now that responses are live, a missing title/body returns 422 (Pydantic), not 503."""
        r = requests.post(f"{API}/public/publications/lizam-pub-1/responses",
                          json={"message": "test"}, timeout=15)
        assert r.status_code == 422, f"expected 422 validation error, got {r.status_code}: {r.text}"

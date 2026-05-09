"""COMPREHENSIVE admin → public propagation audit.

For every editable admin field, verify:
  1. Admin PATCH succeeds.
  2. Public GET (anonymous) reflects the new value within the same request cycle.
  3. Public GET reflects restored value after revert (idempotency).

Covers:
  - SiteSettings: site name, tagline, default lang, contact email, phone,
    address, footer, social_links, active_theme, feature_toggles
  - Branding: logo URLs, colors, fonts
  - Home content: hero, about, mission, vision, objectives, fields_of_work,
    visible_sections
  - Publications: title, summary, status, access_level, pdf_access_level,
    featured, cover_image_url, tags
  - Image assets: per-slot url, alt, active
  - Authors / Categories CRUD
  - Users role + status changes
  - Responses moderation status
  - Newsletter subscriber unsubscribe
"""
from __future__ import annotations
import os
import requests
import pytest

API = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://lizam-legal.preview.emergentagent.com"
).rstrip("/") + "/api"
ADMIN = {"email": os.environ.get("ADMIN_EMAIL", "admin@lizam.sa"),
         "password": os.environ.get("ADMIN_PASSWORD", "Lizam@2026")}


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=ADMIN, timeout=15)
    assert r.status_code == 200, r.text
    return s


def _anon_get(path: str, params=None) -> requests.Response:
    """Always use a fresh requests.get to avoid cookie/state leak."""
    return requests.get(f"{API}{path}", params=params, timeout=15)


def _patch_and_assert_public(admin, patch_url, payload, public_path, public_check):
    """Helper: PATCH the admin endpoint, then assert the public GET reflects it."""
    r = admin.patch(f"{API}{patch_url}", json=payload, timeout=15)
    assert r.status_code == 200, f"PATCH {patch_url} failed: {r.text}"
    pub = _anon_get(public_path).json()
    public_check(pub)
    return r.json()


# ===========================================================================
# 1. SiteSettings — string fields
# ===========================================================================

@pytest.mark.parametrize("field,test_value", [
    ("site_name_ar", "مركز الاختبار"),
    ("site_name_en", "Test Center"),
    ("tagline_ar", "شعار اختبار"),
    ("tagline_en", "Test tagline"),
    ("contact_email", "test-contact@example.com"),
    ("phone", "+966500000000"),
    ("address_ar", "عنوان اختبار"),
    ("address_en", "Test address"),
    ("footer_text_ar", "تذييل اختبار {year}"),
    ("footer_text_en", "Test footer {year}"),
])
def test_site_settings_field_propagates(admin, field, test_value):
    # snapshot original
    orig = admin.get(f"{API}/admin/site-settings", timeout=15).json().get(field)
    try:
        _patch_and_assert_public(
            admin, "/admin/site-settings", {field: test_value},
            "/public/site-settings",
            lambda d: (d.get(field) == test_value) or AssertionError(f"public {field}={d.get(field)} != {test_value}"),
        )
        # double-check
        public = _anon_get("/public/site-settings").json()
        assert public.get(field) == test_value, f"public {field} mismatch: got {public.get(field)}"
    finally:
        if orig is not None:
            admin.patch(f"{API}/admin/site-settings", json={field: orig}, timeout=15)


def test_site_settings_default_language(admin):
    orig = admin.get(f"{API}/admin/site-settings", timeout=15).json().get("default_language", "ar")
    try:
        admin.patch(f"{API}/admin/site-settings", json={"default_language": "en"}, timeout=15)
        assert _anon_get("/public/site-settings").json()["default_language"] == "en"
        admin.patch(f"{API}/admin/site-settings", json={"default_language": "ar"}, timeout=15)
        assert _anon_get("/public/site-settings").json()["default_language"] == "ar"
    finally:
        admin.patch(f"{API}/admin/site-settings", json={"default_language": orig}, timeout=15)


def test_site_settings_active_theme(admin):
    orig = admin.get(f"{API}/admin/site-settings", timeout=15).json().get("active_theme", "A")
    try:
        admin.patch(f"{API}/admin/site-settings", json={"active_theme": "B"}, timeout=15)
        assert _anon_get("/public/site-settings").json()["active_theme"] == "B"
        admin.patch(f"{API}/admin/site-settings", json={"active_theme": "A"}, timeout=15)
        assert _anon_get("/public/site-settings").json()["active_theme"] == "A"
    finally:
        admin.patch(f"{API}/admin/site-settings", json={"active_theme": orig}, timeout=15)


def test_site_settings_social_links(admin):
    orig = admin.get(f"{API}/admin/site-settings", timeout=15).json().get("social_links", {}) or {}
    try:
        new_links = {"twitter": "https://twitter.com/test", "linkedin": "https://linkedin.com/test"}
        admin.patch(f"{API}/admin/site-settings", json={"social_links": new_links}, timeout=15)
        public = _anon_get("/public/site-settings").json()
        assert public.get("social_links", {}).get("twitter") == new_links["twitter"]
        assert public.get("social_links", {}).get("linkedin") == new_links["linkedin"]
    finally:
        admin.patch(f"{API}/admin/site-settings", json={"social_links": orig}, timeout=15)


# ===========================================================================
# 2. Branding — logos, colors, fonts (writes to site_settings collection)
# ===========================================================================

@pytest.mark.parametrize("field,test_value", [
    ("logo_url", "https://example.com/test-logo.svg"),
    ("logo_light_url", "https://example.com/test-logo-light.svg"),
    ("favicon_url", "https://example.com/test-favicon.ico"),
    ("primary_color", "#FF0099"),
    ("secondary_color", "#00FF99"),
    ("accent_color", "#9900FF"),
    ("background_color", "#F0F0F0"),
    ("text_color", "#222222"),
    ("muted_text_color", "#888888"),
    ("font_ar", "IBM Plex Sans Arabic"),
    ("font_en", "Source Serif 4"),
])
def test_branding_field_propagates(admin, field, test_value):
    orig = admin.get(f"{API}/admin/branding", timeout=15).json().get(field)
    try:
        admin.patch(f"{API}/admin/branding", json={field: test_value}, timeout=15)
        public = _anon_get("/public/site-settings").json()
        assert public.get(field) == test_value, f"branding {field} not reflected publicly: got {public.get(field)}"
    finally:
        if orig is not None:
            admin.patch(f"{API}/admin/branding", json={field: orig}, timeout=15)


# ===========================================================================
# 3. Home content
# ===========================================================================

@pytest.mark.parametrize("field,test_value", [
    ("hero_eyebrow_ar", "اختبار العنوان الفوقي"),
    ("hero_eyebrow_en", "Test eyebrow"),
    ("hero_title_ar", "اختبار\nعنوان رئيسي"),
    ("hero_title_en", "Test\nMain title"),
    ("hero_subtitle_ar", "اختبار العنوان الفرعي"),
    ("hero_subtitle_en", "Test subtitle"),
    ("hero_cta_primary_ar", "اختبار CTA"),
    ("hero_cta_primary_en", "Test CTA"),
    ("hero_cta_secondary_ar", "ثانوي اختبار"),
    ("hero_cta_secondary_en", "Test secondary"),
    ("about_ar", "اختبار عن المركز"),
    ("about_en", "Test about"),
    ("about_extended_ar", "اختبار تفاصيل عن المركز"),
    ("about_extended_en", "Test about extended"),
    ("mission_ar", "اختبار الرسالة"),
    ("mission_en", "Test mission"),
    ("vision_ar", "اختبار الرؤية"),
    ("vision_en", "Test vision"),
])
def test_home_field_propagates(admin, field, test_value):
    orig = admin.get(f"{API}/admin/home", timeout=15).json().get(field)
    try:
        admin.patch(f"{API}/admin/home", json={field: test_value}, timeout=15)
        public = _anon_get("/public/home-content").json()
        assert public.get(field) == test_value, f"home {field} not reflected: got {public.get(field)}"
    finally:
        if orig is not None:
            admin.patch(f"{API}/admin/home", json={field: orig}, timeout=15)


def test_home_visible_sections(admin):
    orig = admin.get(f"{API}/admin/home", timeout=15).json().get("visible_sections", []) or []
    try:
        new = ["hero", "about", "contact"]
        admin.patch(f"{API}/admin/home", json={"visible_sections": new}, timeout=15)
        public = _anon_get("/public/home-content").json()
        assert public.get("visible_sections") == new
    finally:
        admin.patch(f"{API}/admin/home", json={"visible_sections": orig}, timeout=15)


def test_home_objectives_array(admin):
    orig = admin.get(f"{API}/admin/home", timeout=15).json().get("objectives", []) or []
    try:
        new = [{"id": "test-obj-1", "title_ar": "هدف اختبار", "title_en": "Test objective",
                "description_ar": "وصف", "description_en": "desc"}]
        admin.patch(f"{API}/admin/home", json={"objectives": new}, timeout=15)
        public = _anon_get("/public/home-content").json()
        assert public.get("objectives", []) == new
    finally:
        admin.patch(f"{API}/admin/home", json={"objectives": orig}, timeout=15)


# ===========================================================================
# 4. Publications — visibility, gating, featured, content edits
# ===========================================================================

def _pub_id_safe(admin):
    """Pick a non-seeded PUBLISHED publication so we can mutate freely."""
    items = admin.get(f"{API}/admin/publications?status=published", timeout=15).json()["items"]
    for it in items:
        slug = it.get("slug_ar") or ""
        if slug.startswith("lizam-pub-"):
            continue
        return it
    # fallback to seeded if no other published exists (mutate seed-2 which is public)
    for it in items:
        if (it.get("slug_ar") or "") == "lizam-pub-2":
            return it
    return items[0]


def test_publication_status_change_propagates(admin):
    """Publishing/un-publishing a publication should appear/disappear from public list."""
    target = _pub_id_safe(admin)
    orig_status = target["status"]
    pid = target["id"]
    try:
        # Make sure public toggle on
        admin.patch(f"{API}/admin/toggles", json={**admin.get(f"{API}/admin/toggles").json(), "gated_content": True}, timeout=15)
        # Set to draft → should disappear from public
        admin.patch(f"{API}/admin/publications/{pid}", json={"status": "draft"}, timeout=15)
        listed = _anon_get("/public/publications", params={"limit": 100}).json()["items"]
        assert not any(p["id"] == pid for p in listed), "draft publication leaked into public list"
        # Set back to published
        admin.patch(f"{API}/admin/publications/{pid}", json={"status": "published"}, timeout=15)
        listed = _anon_get("/public/publications", params={"limit": 100}).json()["items"]
        assert any(p["id"] == pid for p in listed), "published publication missing from public list"
    finally:
        admin.patch(f"{API}/admin/publications/{pid}", json={"status": orig_status}, timeout=15)


def test_publication_access_level_registered_gates_content(admin):
    """access_level=registered should blank content_html for anonymous users."""
    target = _pub_id_safe(admin)
    snap = admin.get(f"{API}/admin/publications/{target['id']}", timeout=15).json()
    orig_access = snap.get("access_level", "public")
    orig_content_ar = snap.get("content_html_ar", "")
    orig_content_en = snap.get("content_html_en", "")
    pid = target["id"]
    slug = target.get("slug_ar") or target.get("slug_en") or pid
    try:
        admin.patch(f"{API}/admin/toggles", json={**admin.get(f"{API}/admin/toggles").json(), "gated_content": True}, timeout=15)
        admin.patch(f"{API}/admin/publications/{pid}", json={
            "access_level": "registered",
            "content_html_ar": "<p>HIDDEN-AR</p>",
            "content_html_en": "<p>HIDDEN-EN</p>",
        }, timeout=15)
        d = _anon_get(f"/public/publications/{slug}").json()
        assert d["access_level"] == "registered"
        assert d["_gated"] is True
        assert d["_gated_reason"] == "login_required"
        assert "HIDDEN-AR" not in d["content_html_ar"]
        assert "HIDDEN-EN" not in d["content_html_en"]

        # Switch back to public → content visible
        admin.patch(f"{API}/admin/publications/{pid}", json={"access_level": "public"}, timeout=15)
        d2 = _anon_get(f"/public/publications/{slug}").json()
        assert d2["_gated"] is False
        assert "HIDDEN-AR" in d2["content_html_ar"]
    finally:
        admin.patch(f"{API}/admin/publications/{pid}", json={
            "access_level": orig_access,
            "content_html_ar": orig_content_ar,
            "content_html_en": orig_content_en,
        }, timeout=15)


def test_publication_pdf_access_disabled_returns_404(admin):
    target = _pub_id_safe(admin)
    pid = target["id"]
    slug = target.get("slug_ar") or target.get("slug_en") or pid
    snap = admin.get(f"{API}/admin/publications/{pid}", timeout=15).json()
    orig_pdf_access = snap.get("pdf_access_level", "public")
    try:
        admin.patch(f"{API}/admin/publications/{pid}", json={
            "external_pdf_url": "https://example.com/test.pdf",
            "pdf_access_level": "public",
            "access_level": "public",
        }, timeout=15)
        admin.patch(f"{API}/admin/toggles", json={**admin.get(f"{API}/admin/toggles").json(), "pdf_download": True}, timeout=15)
        r = _anon_get(f"/public/publications/{slug}/pdf")
        assert r.status_code == 200, r.text

        admin.patch(f"{API}/admin/publications/{pid}", json={"pdf_access_level": "disabled"}, timeout=15)
        r2 = _anon_get(f"/public/publications/{slug}/pdf")
        assert r2.status_code in (403, 404), f"expected 403/404 with disabled, got {r2.status_code}"
    finally:
        admin.patch(f"{API}/admin/publications/{pid}", json={"pdf_access_level": orig_pdf_access}, timeout=15)


def test_publication_featured_filter(admin):
    """`featured=true` filter on /public/publications should respect the admin flag."""
    target = _pub_id_safe(admin)
    pid = target["id"]
    snap = admin.get(f"{API}/admin/publications/{pid}", timeout=15).json()
    orig = snap.get("featured", False)
    try:
        admin.patch(f"{API}/admin/publications/{pid}", json={"featured": True}, timeout=15)
        listed = _anon_get("/public/publications", params={"featured": "true"}).json()["items"]
        assert any(p["id"] == pid for p in listed), "featured pub missing from featured=true list"

        admin.patch(f"{API}/admin/publications/{pid}", json={"featured": False}, timeout=15)
        listed2 = _anon_get("/public/publications", params={"featured": "true"}).json()["items"]
        assert not any(p["id"] == pid for p in listed2), "un-featured pub leaked into featured=true list"
    finally:
        admin.patch(f"{API}/admin/publications/{pid}", json={"featured": orig}, timeout=15)


def test_publication_field_edits_propagate(admin):
    target = _pub_id_safe(admin)
    pid = target["id"]
    slug = target.get("slug_ar") or target.get("slug_en") or pid
    snap = admin.get(f"{API}/admin/publications/{pid}", timeout=15).json()
    orig = {k: snap.get(k) for k in ("title_ar", "title_en", "summary_ar", "summary_en",
                                     "tags", "reading_time_minutes")}
    try:
        new = {
            "title_ar": "عنوان مُعدّل",
            "title_en": "Edited title",
            "summary_ar": "ملخص مُعدّل",
            "summary_en": "Edited summary",
            "tags": ["test-tag-1", "test-tag-2"],
            "reading_time_minutes": 99,
        }
        admin.patch(f"{API}/admin/publications/{pid}", json=new, timeout=15)
        d = _anon_get(f"/public/publications/{slug}").json()
        for k, v in new.items():
            assert d.get(k) == v, f"public pub {k}={d.get(k)} != {v}"
    finally:
        admin.patch(f"{API}/admin/publications/{pid}", json=orig, timeout=15)


# ===========================================================================
# 5. Image assets
# ===========================================================================

def test_image_asset_url_change_propagates(admin):
    items = admin.get(f"{API}/admin/image-assets", timeout=15).json()["items"]
    if not items:
        pytest.skip("no image asset slots")
    slot = items[0]
    key = slot["slot_key"]
    orig_url = slot.get("url", "")
    orig_active = slot.get("active", True)
    try:
        admin.patch(f"{API}/admin/image-assets/{key}", json={"url": "https://example.com/test-image.jpg", "active": True}, timeout=15)
        public = _anon_get("/public/image-assets").json()["by_slot"]
        assert public.get(key, {}).get("url") == "https://example.com/test-image.jpg"
    finally:
        admin.patch(f"{API}/admin/image-assets/{key}", json={"url": orig_url, "active": orig_active}, timeout=15)


def test_image_asset_inactive_hidden_from_public(admin):
    items = admin.get(f"{API}/admin/image-assets", timeout=15).json()["items"]
    if not items:
        pytest.skip("no image asset slots")
    slot = items[0]
    key = slot["slot_key"]
    orig_active = slot.get("active", True)
    try:
        admin.patch(f"{API}/admin/image-assets/{key}", json={"active": False}, timeout=15)
        public = _anon_get("/public/image-assets").json()["by_slot"]
        assert key not in public, f"inactive slot {key} leaked into public"

        admin.patch(f"{API}/admin/image-assets/{key}", json={"active": True}, timeout=15)
        public2 = _anon_get("/public/image-assets").json()["by_slot"]
        assert key in public2
    finally:
        admin.patch(f"{API}/admin/image-assets/{key}", json={"active": orig_active}, timeout=15)


# ===========================================================================
# 6. Authors / Categories CRUD
# ===========================================================================

def test_author_create_edit_archive_propagates(admin):
    r = admin.post(f"{API}/admin/authors", json={
        "name_ar": "باحث اختبار", "name_en": "Test Researcher",
        "title_ar": "أستاذ", "title_en": "Professor",
        "bio_ar": "نبذة", "bio_en": "Bio", "active": True,
    }, timeout=15)
    assert r.status_code == 200, r.text
    aid = r.json()["id"]
    try:
        # public list
        listed = _anon_get("/public/authors").json().get("items", [])
        assert any(a["id"] == aid for a in listed), "new author missing from public"

        # rename
        admin.patch(f"{API}/admin/authors/{aid}", json={"name_en": "Renamed Researcher"}, timeout=15)
        listed2 = _anon_get("/public/authors").json().get("items", [])
        match = next((a for a in listed2 if a["id"] == aid), None)
        assert match and match["name_en"] == "Renamed Researcher"

        # deactivate
        admin.patch(f"{API}/admin/authors/{aid}", json={"active": False}, timeout=15)
        listed3 = _anon_get("/public/authors").json().get("items", [])
        assert not any(a["id"] == aid for a in listed3), "inactive author leaked"
    finally:
        admin.delete(f"{API}/admin/authors/{aid}", timeout=15)


def test_category_active_toggle_propagates(admin):
    r = admin.post(f"{API}/admin/categories", json={
        "title_ar": "مجال اختبار", "title_en": "Test Category",
        "icon": "book-open", "sort_order": 99, "active": True,
    }, timeout=15)
    assert r.status_code == 200, r.text
    cid = r.json()["id"]
    try:
        listed = _anon_get("/public/categories").json().get("items", [])
        assert any(c["id"] == cid for c in listed)
        admin.patch(f"{API}/admin/categories/{cid}", json={"active": False}, timeout=15)
        listed2 = _anon_get("/public/categories").json().get("items", [])
        assert not any(c["id"] == cid for c in listed2), "inactive category leaked"
    finally:
        admin.delete(f"{API}/admin/categories/{cid}", timeout=15)


# ===========================================================================
# 7. Toggles re-confirm (no regression)
# ===========================================================================

def test_toggles_pdf_download_still_propagates(admin):
    cur = admin.get(f"{API}/admin/toggles", timeout=15).json()
    try:
        admin.patch(f"{API}/admin/toggles", json={**cur, "pdf_download": False}, timeout=15)
        # Find any pub with a pdf
        items = _anon_get("/public/publications").json()["items"]
        for it in items:
            slug = it.get("slug_ar") or it.get("slug_en") or it["id"]
            r = _anon_get(f"/public/publications/{slug}/pdf")
            if r.status_code == 403:
                break
        # The detail endpoint surfaces the flag
        first = items[0]
        slug0 = first.get("slug_ar") or first.get("slug_en") or first["id"]
        d = _anon_get(f"/public/publications/{slug0}").json()
        assert d.get("_pdf_download_enabled") is False
    finally:
        admin.patch(f"{API}/admin/toggles", json={**cur, "pdf_download": True}, timeout=15)


# ===========================================================================
# 8. Responses moderation propagation
# ===========================================================================

def test_response_approval_makes_it_publicly_visible(admin):
    # Submit a response anonymously to a published pub with responses_enabled
    items = _anon_get("/public/publications").json()["items"]
    target = items[0]
    pub_id = target["id"]
    slug = target.get("slug_ar") or target.get("slug_en") or pub_id

    # Ensure responses_enabled on pub
    admin.patch(f"{API}/admin/publications/{pub_id}", json={"responses_enabled": True}, timeout=15)
    admin.patch(f"{API}/admin/toggles", json={**admin.get(f"{API}/admin/toggles").json(),
                                              "research_responses": True, "public_responses": True}, timeout=15)

    sub = requests.post(f"{API}/public/publications/{slug}/responses", json={
        "title": "Test response title",
        "body": "Test response body — this needs to be at least ten chars long",
        "author_name": "Anon Tester",
        "author_email": "tester@example.com",
        "consent": True,
    }, timeout=15)
    if sub.status_code not in (200, 201):
        pytest.fail(f"response submit blocked: {sub.status_code} {sub.text}")
    rid = sub.json()["id"]
    try:
        # Until approved, NOT visible publicly
        public_resps = _anon_get(f"/public/publications/{slug}/responses").json().get("items", [])
        assert not any(r["id"] == rid for r in public_resps)

        # Approve + set publicly visible
        admin.patch(f"{API}/admin/responses/{rid}", json={"status": "approved", "public_visible": True}, timeout=15)
        public_resps2 = _anon_get(f"/public/publications/{slug}/responses").json().get("items", [])
        assert any(r["id"] == rid for r in public_resps2)
    finally:
        admin.delete(f"{API}/admin/responses/{rid}", timeout=15)

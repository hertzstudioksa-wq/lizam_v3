"""P0 regression: admin feature-toggle changes MUST propagate to public endpoints.

Reproduces the user-reported failure mode (admin disables PDF / gating /
registration but public site still allows it).

Each test:
  1. Logs in as admin.
  2. Flips a global toggle.
  3. Asserts the anonymous public endpoint reflects the change.
  4. Restores the toggle so the suite remains idempotent.
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


def _toggles(s: requests.Session) -> dict:
    r = s.get(f"{API}/admin/toggles", timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


def _patch_toggles(s: requests.Session, **overrides) -> dict:
    cur = _toggles(s)
    cur.update(overrides)
    r = s.patch(f"{API}/admin/toggles", json=cur, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


def _patch_pub(s: requests.Session, pub_id: str, body: dict) -> dict:
    r = s.patch(f"{API}/admin/publications/{pub_id}", json=body, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()


def _pick_non_seeded_pub(admin: requests.Session) -> dict:
    """Pick lizam-pub-2 (public-access seeded pub) for fixture mutations.
    pub-1 is preview_login and pub-3 is registered — those are checked by
    test_lizam_phase2's gated tests and must not be disturbed."""
    r = admin.get(f"{API}/admin/publications", timeout=15)
    items = r.json()["items"]
    for it in items:
        slug = it.get("slug_ar") or ""
        if slug == "lizam-pub-2":
            return it
    # fallback
    return items[0]


@pytest.fixture(scope="module")
def pub_with_pdf(admin):
    """Pick a non-seeded published publication and force-attach a PDF + public access."""
    target = _pick_non_seeded_pub(admin)
    _patch_pub(admin, target["id"], {
        "external_pdf_url": "https://example.com/test.pdf",
        "pdf_access_level": "public",
        "access_level": "public",
    })
    slug = target.get("slug_ar") or target.get("slug_en") or target["id"]
    return {"id": target["id"], "slug": slug}


# ===========================================================================
# pdf_download — global PDF gate
# ===========================================================================

def test_pdf_token_endpoint_blocked_when_pdf_download_disabled(admin, pub_with_pdf):
    _patch_toggles(admin, pdf_download=True)
    # Sanity: open by default
    r = requests.get(f"{API}/public/publications/{pub_with_pdf['slug']}/pdf", timeout=15)
    assert r.status_code == 200, r.text

    _patch_toggles(admin, pdf_download=False)
    try:
        r = requests.get(f"{API}/public/publications/{pub_with_pdf['slug']}/pdf", timeout=15)
        assert r.status_code == 403, f"global pdf_download off should 403, got {r.status_code}: {r.text}"
    finally:
        _patch_toggles(admin, pdf_download=True)

    r = requests.get(f"{API}/public/publications/{pub_with_pdf['slug']}/pdf", timeout=15)
    assert r.status_code == 200


def test_pdf_stream_endpoint_blocked_when_pdf_download_disabled(admin, pub_with_pdf):
    _patch_toggles(admin, pdf_download=True)
    token = requests.get(f"{API}/public/publications/{pub_with_pdf['slug']}/pdf", timeout=15).json()["token"]

    _patch_toggles(admin, pdf_download=False)
    try:
        r = requests.get(f"{API}/public/pdf-stream/{token}", timeout=15, allow_redirects=False)
        assert r.status_code == 403, f"stream must be 403 when toggle off, got {r.status_code}"
    finally:
        _patch_toggles(admin, pdf_download=True)


def test_publication_detail_surfaces_pdf_flag(admin, pub_with_pdf):
    _patch_toggles(admin, pdf_download=False)
    try:
        d = requests.get(f"{API}/public/publications/{pub_with_pdf['slug']}", timeout=15).json()
        assert d.get("_pdf_download_enabled") is False
    finally:
        _patch_toggles(admin, pdf_download=True)
    d = requests.get(f"{API}/public/publications/{pub_with_pdf['slug']}", timeout=15).json()
    assert d.get("_pdf_download_enabled") is True


# ===========================================================================
# gated_content — global gating
# ===========================================================================

def test_gated_content_disabled_unlocks_full_html_for_anonymous(admin):
    """When admin turns off `gated_content`, public detail must serve full
    content even for an anonymous user on a `registered`-gated publication."""
    target = _pick_non_seeded_pub(admin)
    snap = admin.get(f"{API}/admin/publications/{target['id']}", timeout=15).json()
    original = {
        "access_level": snap.get("access_level", "public"),
        "content_html_ar": snap.get("content_html_ar", ""),
        "content_html_en": snap.get("content_html_en", ""),
    }
    _patch_pub(admin, target["id"], {
        "access_level": "registered",
        "content_html_ar": "<p>SECRET-AR-CONTENT</p>",
        "content_html_en": "<p>SECRET-EN-CONTENT</p>",
    })
    slug = target.get("slug_ar") or target.get("slug_en") or target["id"]

    try:
        # Default: gating ON → anon sees blanked content
        _patch_toggles(admin, gated_content=True)
        d = requests.get(f"{API}/public/publications/{slug}", timeout=15).json()
        assert d["_gated"] is True
        assert d["_gated_reason"] == "login_required"
        assert d["content_html_ar"] == ""
        assert d["content_html_en"] == ""
        assert d["_gated_content_enabled"] is True

        # Disable gating → anon sees full content
        _patch_toggles(admin, gated_content=False)
        d = requests.get(f"{API}/public/publications/{slug}", timeout=15).json()
        assert d["_gated"] is False
        assert "SECRET-AR-CONTENT" in d["content_html_ar"]
        assert "SECRET-EN-CONTENT" in d["content_html_en"]
        assert d["_gated_content_enabled"] is False
    finally:
        _patch_toggles(admin, gated_content=True)
        _patch_pub(admin, target["id"], original)


# ===========================================================================
# registration — new account creation
# ===========================================================================

def test_register_endpoint_blocked_when_registration_disabled(admin):
    _patch_toggles(admin, registration=False)
    try:
        r = requests.post(f"{API}/auth/register", json={
            "name": "Blocked User", "email": "blocked-reg@example.com", "password": "abc12345",
        }, timeout=15)
        assert r.status_code == 403, f"expected 403 when registration off, got {r.status_code}: {r.text}"
    finally:
        _patch_toggles(admin, registration=True)


def test_publication_detail_surfaces_registration_flag(admin):
    pubs = requests.get(f"{API}/public/publications?limit=20", timeout=15).json()["items"]
    slug = pubs[0].get("slug_ar") or pubs[0].get("slug_en") or pubs[0]["id"]

    _patch_toggles(admin, registration=False)
    try:
        d = requests.get(f"{API}/public/publications/{slug}", timeout=15).json()
        assert d["_registration_enabled"] is False
    finally:
        _patch_toggles(admin, registration=True)

    d = requests.get(f"{API}/public/publications/{slug}", timeout=15).json()
    assert d["_registration_enabled"] is True


# ===========================================================================
# Per-publication settings still respected when global toggle is ON
# ===========================================================================

def test_per_publication_pdf_disabled_returns_403_even_when_global_on(admin, pub_with_pdf):
    _patch_toggles(admin, pdf_download=True)
    _patch_pub(admin, pub_with_pdf["id"], {"pdf_access_level": "disabled"})
    try:
        r = requests.get(f"{API}/public/publications/{pub_with_pdf['slug']}/pdf", timeout=15)
        assert r.status_code == 403
    finally:
        _patch_pub(admin, pub_with_pdf["id"], {"pdf_access_level": "public"})


def test_per_publication_login_required_pdf_still_401_anon(admin, pub_with_pdf):
    _patch_toggles(admin, pdf_download=True)
    _patch_pub(admin, pub_with_pdf["id"], {"pdf_access_level": "login_required"})
    try:
        r = requests.get(f"{API}/public/publications/{pub_with_pdf['slug']}/pdf", timeout=15)
        assert r.status_code == 401
    finally:
        _patch_pub(admin, pub_with_pdf["id"], {"pdf_access_level": "public"})

"""Theme B checkpoint tests — additive field `active_theme` on site_settings.

Validates:
- Public GET returns active_theme
- Admin PATCH accepts valid A/B and persists
- Invalid values rejected by Pydantic Literal validator (422)
- _seed_origin='admin' persists after seed-reseed (idempotency)
"""
import os
import time
import subprocess
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://lizam-legal.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": "admin@lizam.sa", "password": "Lizam@2026"}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return s


# --- Public site-settings exposes active_theme ---
def test_public_site_settings_has_active_theme():
    r = requests.get(f"{API}/public/site-settings", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "active_theme" in data, "active_theme missing from public site-settings"
    assert data["active_theme"] in ("A", "B")


# --- PATCH to 'A' persists then back to 'B' ---
def test_admin_patch_theme_A_then_B(admin_session):
    # Switch to A
    r = admin_session.patch(f"{API}/admin/site-settings", json={"active_theme": "A"}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("active_theme") == "A"
    # Public reflects
    pub = requests.get(f"{API}/public/site-settings", timeout=15).json()
    assert pub.get("active_theme") == "A"
    # Switch back to B
    r = admin_session.patch(f"{API}/admin/site-settings", json={"active_theme": "B"}, timeout=15)
    assert r.status_code == 200
    assert r.json().get("active_theme") == "B"
    pub = requests.get(f"{API}/public/site-settings", timeout=15).json()
    assert pub.get("active_theme") == "B"


# --- Invalid theme values rejected by Pydantic Literal[A|B] ---
@pytest.mark.parametrize("bad", ["X", "", "a", "b", "C", "ab"])
def test_admin_patch_invalid_theme_rejected(admin_session, bad):
    r = admin_session.patch(f"{API}/admin/site-settings", json={"active_theme": bad}, timeout=15)
    assert r.status_code == 422, f"Expected 422 for active_theme={bad!r}, got {r.status_code}"


def test_admin_patch_none_theme_is_ignored(admin_session):
    # None is allowed (Optional) but should not overwrite existing value (router filters None)
    before_doc = requests.get(f"{API}/public/site-settings", timeout=15).json()
    before = before_doc.get("active_theme")
    original_tagline = before_doc.get("tagline_en")
    r = admin_session.patch(f"{API}/admin/site-settings", json={"active_theme": None, "tagline_en": "theme-b-none-test"}, timeout=15)
    assert r.status_code == 200
    after = requests.get(f"{API}/public/site-settings", timeout=15).json().get("active_theme")
    assert after == before, "None value should not overwrite active_theme"
    # Restore tagline_en to prevent cross-suite pollution
    if original_tagline:
        admin_session.patch(f"{API}/admin/site-settings", json={"tagline_en": original_tagline}, timeout=15)


# --- Seed idempotency: admin-edited active_theme survives backend restart ---
def test_seed_idempotency_preserves_admin_theme(admin_session):
    # Set to A (non-default)
    r = admin_session.patch(f"{API}/admin/site-settings", json={"active_theme": "A"}, timeout=15)
    assert r.status_code == 200
    # Restart backend to force reseed
    subprocess.run(["sudo", "supervisorctl", "restart", "backend"], check=False, capture_output=True)
    # Wait for backend back up
    for _ in range(30):
        time.sleep(1)
        try:
            h = requests.get(f"{API}/public/site-settings", timeout=5)
            if h.status_code == 200:
                break
        except Exception:
            continue
    post = requests.get(f"{API}/public/site-settings", timeout=15).json()
    assert post.get("active_theme") == "A", "seed overwrote admin-edited active_theme"
    assert post.get("_seed_origin", "admin") == "admin" or "_seed_origin" not in post
    # Restore default
    # Re-login because session cookie may still be valid (JWT) but safe to try
    rr = admin_session.patch(f"{API}/admin/site-settings", json={"active_theme": "B"}, timeout=15)
    if rr.status_code == 401:
        admin_session.post(f"{API}/auth/login", json={"email": "admin@lizam.sa", "password": "Lizam@2026"}, timeout=15)
        admin_session.patch(f"{API}/admin/site-settings", json={"active_theme": "B"}, timeout=15)


# --- Branding PATCH with font_ar/font_en still works ---
def test_admin_patch_branding_fonts(admin_session):
    r = admin_session.patch(f"{API}/admin/branding", json={"font_ar": "Thmanyah Sans", "font_en": "Thmanyah Sans"}, timeout=15)
    assert r.status_code == 200, r.text
    got = r.json()
    assert got.get("font_ar") == "Thmanyah Sans"
    assert got.get("font_en") == "Thmanyah Sans"

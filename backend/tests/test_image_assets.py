"""Image asset slot tests — public + admin endpoints, seed, idempotency."""
import os
import time
import subprocess
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://lizam-legal.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

EXPECTED_SLOTS = {"about_image", "objectives_background"}


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": "admin@lizam.sa", "password": "Lizam@2026"}, timeout=15)
    assert r.status_code == 200, f"login: {r.status_code} {r.text}"
    return s


@pytest.fixture(autouse=True)
def reset_objectives_background(admin_session):
    """Defensive: other suites may have left objectives_background active=True.
    These tests assume the seed default (active=False)."""
    admin_session.patch(
        f"{API}/admin/image-assets/objectives_background",
        json={"active": False},
        timeout=15,
    )
    yield


# --- Public endpoint (no auth) ---
def test_public_image_assets_returns_active_only():
    r = requests.get(f"{API}/public/image-assets", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data and "by_slot" in data
    items = data["items"]
    # Only active slots should be returned
    for it in items:
        assert it.get("active") is True, f"Inactive slot leaked: {it.get('slot_key')}"
    slot_keys = {it["slot_key"] for it in items}
    # about_image is the always-active slot consumed by Theme B
    assert "about_image" in slot_keys
    # objectives_background defaults to active=False → NOT in public response
    assert "objectives_background" not in slot_keys
    # by_slot lookup returns absolute URL
    assert data["by_slot"]["about_image"]["url"].startswith("http")


# --- Admin list requires auth ---
def test_admin_image_assets_unauth_is_401():
    r = requests.get(f"{API}/admin/image-assets", timeout=15)
    assert r.status_code in (401, 403)


def test_admin_image_assets_list_as_super_admin(admin_session):
    r = admin_session.get(f"{API}/admin/image-assets", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "items" in data
    slot_keys = {it["slot_key"] for it in data["items"]}
    assert EXPECTED_SLOTS.issubset(slot_keys), f"Missing slots: {EXPECTED_SLOTS - slot_keys}"
    # Admin sees inactive too
    inactive = [it for it in data["items"] if it.get("active") is False]
    assert any(it["slot_key"] == "objectives_background" for it in inactive)
    # Required metadata
    about = next(it for it in data["items"] if it["slot_key"] == "about_image")
    for k in ("recommended_width", "recommended_height", "aspect_ratio",
              "usage_note_ar", "usage_note_en", "title_ar", "title_en"):
        assert k in about, f"Missing field {k} on about_image"


# --- Role-based: editor should NOT be able to list (settings.read gate) ---
def test_admin_image_assets_unprivileged_is_403(admin_session):
    """Editor role lacks settings.read; we simulate by creating a registered user."""
    # Create a registered user
    email = f"TEST_imguser_{int(time.time())}@example.com"
    reg = requests.post(f"{API}/auth/register",
                        json={"name": "Img Test", "email": email, "password": "Passw0rd!"},
                        timeout=15)
    if reg.status_code not in (200, 201):
        pytest.skip(f"register failed: {reg.status_code}")
    s = requests.Session()
    login = s.post(f"{API}/auth/login", json={"email": email, "password": "Passw0rd!"}, timeout=15)
    if login.status_code != 200:
        pytest.skip("login for registered user failed")
    r = s.get(f"{API}/admin/image-assets", timeout=15)
    assert r.status_code in (401, 403), f"registered user got {r.status_code}"


# --- PATCH non-existent slot returns 404 ---
def test_admin_patch_unknown_slot_is_404(admin_session):
    r = admin_session.patch(f"{API}/admin/image-assets/__does_not_exist__",
                            json={"alt_en": "x"}, timeout=15)
    assert r.status_code == 404


# --- PATCH updates url/alt/active; persists; _seed_origin=admin ---
def test_admin_patch_updates_and_persists(admin_session):
    slot = "about_image"
    # Capture original
    before = admin_session.get(f"{API}/admin/image-assets", timeout=15).json()
    orig = next(it for it in before["items"] if it["slot_key"] == slot)

    new_url = "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=2400"
    new_alt_ar = "TEST_alt_ar_" + str(int(time.time()))
    new_alt_en = "TEST_alt_en"
    r = admin_session.patch(f"{API}/admin/image-assets/{slot}",
                            json={"url": new_url, "alt_ar": new_alt_ar,
                                  "alt_en": new_alt_en, "active": True},
                            timeout=15)
    assert r.status_code == 200, r.text
    got = r.json()
    assert got["url"] == new_url
    assert got["alt_ar"] == new_alt_ar
    assert got["alt_en"] == new_alt_en
    assert got.get("_seed_origin") == "admin"

    # Public reflects change
    pub = requests.get(f"{API}/public/image-assets", timeout=15).json()
    assert pub["by_slot"][slot]["url"] == new_url
    assert pub["by_slot"][slot]["alt_en"] == new_alt_en

    # Restore original (url/alt)
    admin_session.patch(f"{API}/admin/image-assets/{slot}",
                        json={"url": orig["url"], "alt_ar": orig["alt_ar"],
                              "alt_en": orig["alt_en"]}, timeout=15)


# --- Toggle active flips public visibility ---
def test_admin_toggle_active_changes_public_visibility(admin_session):
    slot = "objectives_background"
    # Default: inactive. Activate it.
    r = admin_session.patch(f"{API}/admin/image-assets/{slot}",
                            json={"active": True}, timeout=15)
    assert r.status_code == 200
    pub = requests.get(f"{API}/public/image-assets", timeout=15).json()
    assert slot in pub["by_slot"], "slot should appear in public after activate"

    # Deactivate
    r = admin_session.patch(f"{API}/admin/image-assets/{slot}",
                            json={"active": False}, timeout=15)
    assert r.status_code == 200
    pub = requests.get(f"{API}/public/image-assets", timeout=15).json()
    assert slot not in pub["by_slot"], "slot should disappear from public after deactivate"


# --- Seed idempotency: admin-edited slot is NOT overwritten on backend restart ---
def test_seed_preserves_admin_edits(admin_session):
    slot = "about_image"
    # Capture & stamp admin edit
    before = admin_session.get(f"{API}/admin/image-assets", timeout=15).json()
    orig = next(it for it in before["items"] if it["slot_key"] == slot)

    marker_alt = f"TEST_admin_marker_{int(time.time())}"
    r = admin_session.patch(f"{API}/admin/image-assets/{slot}",
                            json={"alt_en": marker_alt}, timeout=15)
    assert r.status_code == 200
    assert r.json().get("_seed_origin") == "admin"

    # Restart backend → triggers reseed
    subprocess.run(["sudo", "supervisorctl", "restart", "backend"],
                   check=False, capture_output=True)
    for _ in range(30):
        time.sleep(1)
        try:
            if requests.get(f"{API}/public/site-settings", timeout=5).status_code == 200:
                break
        except Exception:
            continue

    # Verify marker survived
    re_login = admin_session.post(f"{API}/auth/login",
                                  json={"email": "admin@lizam.sa", "password": "Lizam@2026"},
                                  timeout=15)
    assert re_login.status_code == 200
    after = admin_session.get(f"{API}/admin/image-assets", timeout=15).json()
    post = next(it for it in after["items"] if it["slot_key"] == slot)
    assert post["alt_en"] == marker_alt, "seed overwrote admin-edited image slot"
    assert post.get("_seed_origin") == "admin"

    # Restore original alt_en
    admin_session.patch(f"{API}/admin/image-assets/{slot}",
                        json={"alt_en": orig.get("alt_en", "")}, timeout=15)

"""Hero media (per-page configurable hero background) — backend tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_EMAIL = "admin@lizam.sa"
ADMIN_PASSWORD = "Lizam@2026"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
               timeout=15)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code}")
    return s


# ---------- Public endpoint ----------

def test_public_hero_media_shape():
    r = requests.get(f"{BASE_URL}/api/public/hero-media", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data and isinstance(data["items"], list)
    assert "by_page" in data and isinstance(data["by_page"], dict)
    assert "default" in data
    by_page = data["by_page"]
    assert "_default" in by_page, f"_default missing; keys={list(by_page.keys())}"
    assert "home" in by_page, f"home missing; keys={list(by_page.keys())}"
    assert "publications" in by_page, f"publications missing; keys={list(by_page.keys())}"
    # _id excluded
    for item in data["items"]:
        assert "_id" not in item
        assert "page_key" in item


# ---------- Admin list ----------

def test_admin_hero_media_list(admin_session):
    r = admin_session.get(f"{BASE_URL}/api/admin/hero-media", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    keys = {it["page_key"] for it in data["items"]}
    assert {"_default", "home", "publications"}.issubset(keys)


def test_admin_hero_media_unauth():
    r = requests.get(f"{BASE_URL}/api/admin/hero-media", timeout=10)
    assert r.status_code in (401, 403)


# ---------- PATCH home: persist + GET reflects ----------

def test_patch_home_and_persist(admin_session):
    body = {
        "url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2400",
        "overlay_opacity": 0.65,
        "focal_x": 60,
        "focal_y": 40,
        "enabled": True,
    }
    r = admin_session.patch(f"{BASE_URL}/api/admin/hero-media/home", json=body, timeout=10)
    assert r.status_code == 200, r.text
    doc = r.json()
    assert doc["page_key"] == "home"
    assert doc["overlay_opacity"] == 0.65
    assert doc["focal_x"] == 60
    assert doc["focal_y"] == 40

    # GET public reflects
    g = requests.get(f"{BASE_URL}/api/public/hero-media", timeout=10).json()
    home = g["by_page"]["home"]
    assert home["overlay_opacity"] == 0.65
    assert home["focal_x"] == 60
    assert home["focal_y"] == 40


# ---------- PATCH about: creates new record ----------

def test_patch_about_creates_record(admin_session):
    # Ensure not seeded — delete first if present
    admin_session.delete(f"{BASE_URL}/api/admin/hero-media/about", timeout=10)

    body = {
        "url": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=2400",
        "overlay_opacity": 0.5,
        "focal_x": 50,
        "focal_y": 50,
        "enabled": True,
    }
    r = admin_session.patch(f"{BASE_URL}/api/admin/hero-media/about", json=body, timeout=10)
    assert r.status_code == 200, r.text
    doc = r.json()
    assert doc["page_key"] == "about"

    g = requests.get(f"{BASE_URL}/api/public/hero-media", timeout=10).json()
    assert "about" in g["by_page"]

    # Cleanup: remove the about record so we restore initial state
    admin_session.delete(f"{BASE_URL}/api/admin/hero-media/about", timeout=10)


# ---------- Validation: overlay_opacity 1.5 should fail ----------

def test_patch_invalid_overlay_opacity(admin_session):
    r = admin_session.patch(f"{BASE_URL}/api/admin/hero-media/home",
                            json={"overlay_opacity": 1.5}, timeout=10)
    assert r.status_code == 422


def test_patch_invalid_focal_x_negative(admin_session):
    r = admin_session.patch(f"{BASE_URL}/api/admin/hero-media/home",
                            json={"focal_x": -10}, timeout=10)
    assert r.status_code == 422


def test_patch_invalid_focal_x_over(admin_session):
    r = admin_session.patch(f"{BASE_URL}/api/admin/hero-media/home",
                            json={"focal_x": 110}, timeout=10)
    assert r.status_code == 422


# ---------- DELETE home then restore ----------

def test_delete_home_falls_back_to_default(admin_session):
    # Capture seed-ish defaults so we can restore
    pre = requests.get(f"{BASE_URL}/api/public/hero-media", timeout=10).json()
    home_pre = pre["by_page"].get("home", {})
    saved = {
        "url": home_pre.get("url", "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2400"),
        "overlay_opacity": 0.55,
        "focal_x": 50,
        "focal_y": 45,
        "enabled": True,
    }

    # DELETE
    r = admin_session.delete(f"{BASE_URL}/api/admin/hero-media/home", timeout=10)
    assert r.status_code == 200

    g = requests.get(f"{BASE_URL}/api/public/hero-media", timeout=10).json()
    assert "home" not in g["by_page"], f"home record should be gone; got {list(g['by_page'].keys())}"
    assert g["default"] is not None
    assert g["default"]["page_key"] == "_default"

    # Restore (tests requirement to leave seeded state)
    rr = admin_session.patch(f"{BASE_URL}/api/admin/hero-media/home", json=saved, timeout=10)
    assert rr.status_code == 200


# ---------- DELETE _default → 400 ----------

def test_delete_default_forbidden(admin_session):
    r = admin_session.delete(f"{BASE_URL}/api/admin/hero-media/_default", timeout=10)
    assert r.status_code == 400


# ---------- Unknown page_key ----------

def test_patch_unknown_page_key(admin_session):
    r = admin_session.patch(f"{BASE_URL}/api/admin/hero-media/unknownpage",
                            json={"overlay_opacity": 0.5}, timeout=10)
    assert r.status_code == 404


# ---------- Restore seeded state at end of session ----------

def test_zzz_restore_seeded_state(admin_session):
    """Final cleanup: restore home + publications to seed defaults
    (focal=(50,45)/(50,50), opacity=0.55) per main-agent instructions."""
    admin_session.patch(f"{BASE_URL}/api/admin/hero-media/home", json={
        "overlay_opacity": 0.55, "focal_x": 50, "focal_y": 45, "enabled": True,
    }, timeout=10)
    admin_session.patch(f"{BASE_URL}/api/admin/hero-media/publications", json={
        "overlay_opacity": 0.55, "focal_x": 50, "focal_y": 50, "enabled": True,
    }, timeout=10)
    admin_session.delete(f"{BASE_URL}/api/admin/hero-media/about", timeout=10)
    admin_session.delete(f"{BASE_URL}/api/admin/hero-media/contact", timeout=10)

    # Final verification
    g = requests.get(f"{BASE_URL}/api/public/hero-media", timeout=10).json()
    assert g["by_page"]["home"]["overlay_opacity"] == 0.55
    assert g["by_page"]["home"]["focal_y"] == 45
    assert g["by_page"]["publications"]["overlay_opacity"] == 0.55

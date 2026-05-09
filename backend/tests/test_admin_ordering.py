"""E2E tests for the admin ordering / drag-and-drop layer.

Covers:
  - Header navigation order persistence + public reflection
  - Header navigation hiding (item not in array → not in public)
  - Categories reorder bulk endpoint + public list order
  - Authors reorder bulk endpoint + public list order (sort_order field)
  - Home sections order persistence
  - Home objectives array reorder persistence
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


# ===========================================================================
# Header navigation order
# ===========================================================================

def test_header_nav_order_round_trip(admin):
    """Admin sets header_nav_order → public site-settings reflects it."""
    orig = admin.get(f"{API}/admin/site-settings", timeout=15).json().get("header_nav_order")
    try:
        new_order = ["contact", "about", "publications", "home"]
        admin.patch(f"{API}/admin/site-settings", json={"header_nav_order": new_order}, timeout=15)
        public = requests.get(f"{API}/public/site-settings", timeout=15).json()
        assert public.get("header_nav_order") == new_order
    finally:
        admin.patch(f"{API}/admin/site-settings", json={"header_nav_order": orig}, timeout=15)


def test_header_nav_hidden_item_not_in_array(admin):
    """Hiding an item = removing it from the array. Public reflects."""
    orig = admin.get(f"{API}/admin/site-settings", timeout=15).json().get("header_nav_order")
    try:
        # Hide "contact"
        admin.patch(f"{API}/admin/site-settings",
                    json={"header_nav_order": ["home", "publications", "about"]}, timeout=15)
        public = requests.get(f"{API}/public/site-settings", timeout=15).json()
        assert "contact" not in public.get("header_nav_order", [])

        # Restore visible — public reflects
        admin.patch(f"{API}/admin/site-settings",
                    json={"header_nav_order": ["home", "publications", "about", "contact"]}, timeout=15)
        public2 = requests.get(f"{API}/public/site-settings", timeout=15).json()
        assert "contact" in public2.get("header_nav_order", [])
    finally:
        admin.patch(f"{API}/admin/site-settings", json={"header_nav_order": orig}, timeout=15)


# ===========================================================================
# Categories reorder
# ===========================================================================

def test_categories_reorder_endpoint_changes_public_order(admin):
    cats = admin.get(f"{API}/admin/categories", timeout=15).json()["items"]
    # Take just the first 5 to keep the test fast and avoid touching unrelated data.
    cats = cats[:5]
    if len(cats) < 2:
        pytest.skip("need ≥2 categories to test reorder")
    orig_order = [(c["id"], c.get("sort_order", 0)) for c in cats]
    target_ids = [c["id"] for c in cats]
    try:
        # Reverse the sort_order values for our 5 targets
        body = [{"id": cid, "sort_order": idx}
                for idx, cid in enumerate(reversed(target_ids))]
        r = admin.post(f"{API}/admin/categories/reorder", json=body, timeout=15)
        assert r.status_code == 200, r.text

        public = requests.get(f"{API}/public/categories", timeout=15).json()["items"]
        # The 5 target categories must appear in REVERSED relative order in public
        public_ids_in_target = [c["id"] for c in public if c["id"] in target_ids]
        assert public_ids_in_target == list(reversed(target_ids)), (
            f"reordered public list mismatch: got {public_ids_in_target}, expected {list(reversed(target_ids))}"
        )
    finally:
        admin.post(f"{API}/admin/categories/reorder",
                   json=[{"id": cid, "sort_order": so} for cid, so in orig_order], timeout=15)


# ===========================================================================
# Authors reorder
# ===========================================================================

def test_authors_reorder_endpoint_changes_admin_order(admin):
    authors = admin.get(f"{API}/admin/authors", timeout=15).json()["items"]
    if len(authors) < 2:
        # Create two test authors
        a1 = admin.post(f"{API}/admin/authors", json={"name_ar": "أ1", "name_en": "Author 1", "active": True}, timeout=15).json()
        a2 = admin.post(f"{API}/admin/authors", json={"name_ar": "أ2", "name_en": "Author 2", "active": True}, timeout=15).json()
        cleanup_ids = [a1["id"], a2["id"]]
        authors = admin.get(f"{API}/admin/authors", timeout=15).json()["items"]
    else:
        cleanup_ids = []

    orig_order = [(a["id"], a.get("sort_order", 0)) for a in authors]
    try:
        body = [{"id": a["id"], "sort_order": idx}
                for idx, a in enumerate(reversed(authors))]
        r = admin.post(f"{API}/admin/authors/reorder", json=body, timeout=15)
        assert r.status_code == 200, r.text

        # Admin list reflects new order
        listed = admin.get(f"{API}/admin/authors", timeout=15).json()["items"]
        # The first row should have the lowest sort_order (which is the previously last)
        assert listed[0]["id"] == authors[-1]["id"]
    finally:
        if orig_order:
            admin.post(f"{API}/admin/authors/reorder",
                       json=[{"id": aid, "sort_order": so} for aid, so in orig_order], timeout=15)
        for aid in cleanup_ids:
            admin.delete(f"{API}/admin/authors/{aid}", timeout=15)


# ===========================================================================
# Home sections + objectives reorder (round-trip via existing PATCH /admin/home)
# ===========================================================================

def test_home_visible_sections_order_persists(admin):
    orig = admin.get(f"{API}/admin/home", timeout=15).json().get("visible_sections", [])
    try:
        custom = ["hero", "contact", "about", "mission", "vision"]
        admin.patch(f"{API}/admin/home", json={"visible_sections": custom}, timeout=15)
        public = requests.get(f"{API}/public/home-content", timeout=15).json()
        assert public["visible_sections"] == custom
    finally:
        admin.patch(f"{API}/admin/home", json={"visible_sections": orig}, timeout=15)


def test_home_objectives_array_reorder_persists(admin):
    orig = admin.get(f"{API}/admin/home", timeout=15).json().get("objectives", []) or []
    try:
        seed = [
            {"id": "obj-1", "title_ar": "هدف 1", "title_en": "Goal 1"},
            {"id": "obj-2", "title_ar": "هدف 2", "title_en": "Goal 2"},
            {"id": "obj-3", "title_ar": "هدف 3", "title_en": "Goal 3"},
        ]
        admin.patch(f"{API}/admin/home", json={"objectives": seed}, timeout=15)

        # Reverse
        reversed_seed = list(reversed(seed))
        admin.patch(f"{API}/admin/home", json={"objectives": reversed_seed}, timeout=15)

        public = requests.get(f"{API}/public/home-content", timeout=15).json()
        assert [o["id"] for o in public.get("objectives", [])] == ["obj-3", "obj-2", "obj-1"]
    finally:
        admin.patch(f"{API}/admin/home", json={"objectives": orig}, timeout=15)

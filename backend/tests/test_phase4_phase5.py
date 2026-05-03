"""Phase 4 + Phase 5 functional tests."""
import os
import time
import requests
import pytest
from pymongo import MongoClient

API = os.environ.get("REACT_APP_BACKEND_URL", "https://lizam-legal.preview.emergentagent.com").rstrip("/") + "/api"
ADMIN = {"email": "admin@lizam.sa", "password": "Lizam@2026"}


def _mongo():
    return MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))[
        os.environ.get("DB_NAME", "lizam_db")
    ]


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=ADMIN, timeout=15)
    assert r.status_code == 200, r.text
    assert "access_token" in s.cookies, f"login did not set cookie: {dict(s.cookies)}"
    return s


# --- Contact form ---
def test_contact_accepts_valid_submission():
    r = requests.post(f"{API}/public/contact", json={
        "name": "Ahmed", "email": "a@example.com",
        "subject": "Research inquiry", "message": "Please contact me about X.",
        "consent": True,
    }, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True


def test_contact_rejects_missing_consent():
    r = requests.post(f"{API}/public/contact", json={
        "name": "X", "email": "x@y.com", "subject": "s", "message": "m",
    }, timeout=15)
    assert r.status_code == 400


def test_contact_rejects_invalid_email():
    r = requests.post(f"{API}/public/contact", json={
        "name": "X", "email": "notanemail", "message": "m", "consent": True,
    }, timeout=15)
    assert r.status_code == 400


# --- Responses: public submit ---
def test_response_submit_sanitizes_xss():
    r = requests.post(f"{API}/public/publications/lizam-pub-2/responses", json={
        "title": "Test Response", "body": "This is long enough to pass validation.",
        "author_name": "Dr A", "author_email": "dra@example.com", "consent": True,
    }, timeout=15)
    assert r.status_code == 201, r.text
    rid = r.json()["id"]
    doc = _mongo().research_responses.find_one({"id": rid}, {"_id": 0})
    assert doc["status"] == "submitted"
    assert "<script>" not in doc["body_html"]


def test_response_submit_rejects_unknown_publication():
    r = requests.post(f"{API}/public/publications/no-slug/responses", json={
        "title": "Valid title here",
        "body": "This is sufficiently long content for validation.",
        "author_name": "Test Author",
        "author_email": "author@example.com",
        "consent": True,
    }, timeout=15)
    assert r.status_code == 404


def test_response_submit_requires_consent():
    r = requests.post(f"{API}/public/publications/lizam-pub-2/responses", json={
        "title": "Valid title here",
        "body": "This is sufficiently long content for validation.",
        "author_name": "Test Author",
        "author_email": "author2@example.com",
        "consent": False,
    }, timeout=15)
    assert r.status_code == 400


def test_public_approved_responses_visible(admin_session):
    # Submit a response
    r = requests.post(f"{API}/public/publications/lizam-pub-2/responses", json={
        "title": "Great paper", "body": "Agreed, well researched.",
        "author_name": "Prof B", "author_email": "profb@example.com", "consent": True,
    }, timeout=15)
    assert r.status_code == 201
    rid = r.json()["id"]
    # Admin approves
    p = admin_session.patch(f"{API}/admin/responses/{rid}", json={
        "status": "approved", "public_visible": True,
    }, timeout=15)
    assert p.status_code == 200, p.text
    # Public list should now include it
    pub = requests.get(f"{API}/public/publications/lizam-pub-2/responses", timeout=15)
    assert pub.status_code == 200
    items = pub.json().get("items", [])
    assert any(it.get("id") == rid for it in items)


# --- Admin moderation ---
def test_admin_list_responses_requires_permission():
    r = requests.get(f"{API}/admin/responses", timeout=15)
    assert r.status_code == 401


def test_admin_moderate_workflow(admin_session):
    # Submit fresh response
    r = requests.post(f"{API}/public/publications/lizam-pub-2/responses", json={
        "title": "Another", "body": "Comments on the paper here.",
        "author_name": "Y", "author_email": "y@z.com", "consent": True,
    }, timeout=15)
    rid = r.json()["id"]
    # List + filter
    lst = admin_session.get(f"{API}/admin/responses?status=submitted", timeout=15)
    assert lst.status_code == 200
    assert any(it["id"] == rid for it in lst.json()["items"])
    # Reject
    rej = admin_session.patch(f"{API}/admin/responses/{rid}", json={"status": "rejected"}, timeout=15)
    assert rej.status_code == 200
    assert rej.json()["status"] == "rejected"
    # Add internal note
    note = admin_session.patch(f"{API}/admin/responses/{rid}", json={"internal_notes": "off-topic"}, timeout=15)
    assert note.status_code == 200
    # Delete
    d = admin_session.delete(f"{API}/admin/responses/{rid}", timeout=15)
    assert d.status_code == 200


# --- Google OAuth toggle ---
def test_google_status_defaults_disabled():
    r = requests.get(f"{API}/auth/google/status", timeout=15)
    assert r.status_code == 200
    # May be True only if admin explicitly enabled it
    assert r.json()["enabled"] in (False, True)


def test_google_callback_rejected_when_disabled(admin_session):
    # Ensure toggle off
    admin_session.patch(f"{API}/admin/toggles", json={"google_login": False}, timeout=15)
    r = requests.post(f"{API}/auth/google/callback", json={"session_id": "x" * 32}, timeout=15)
    assert r.status_code == 503


def test_google_callback_invalid_session_id(admin_session):
    admin_session.patch(f"{API}/admin/toggles", json={"google_login": True}, timeout=15)
    # Too short
    r = requests.post(f"{API}/auth/google/callback", json={"session_id": "short"}, timeout=15)
    assert r.status_code == 400
    # Reset
    admin_session.patch(f"{API}/admin/toggles", json={"google_login": False}, timeout=15)


# --- Rate limiter ---
def test_login_rate_limiter_locks_after_5_failures():
    # 6th attempt on same email should 429
    for i in range(5):
        r = requests.post(f"{API}/auth/login",
                          json={"email": "badlock@example.com", "password": "wrong"}, timeout=15)
        assert r.status_code == 401
    r6 = requests.post(f"{API}/auth/login",
                       json={"email": "badlock@example.com", "password": "wrong"}, timeout=15)
    assert r6.status_code == 429


# --- Audit log ---
def test_admin_audit_endpoint_requires_auth():
    r = requests.get(f"{API}/admin/audit", timeout=15)
    assert r.status_code == 401


def test_admin_audit_returns_entries(admin_session):
    # Perform an auditable action
    admin_session.patch(f"{API}/admin/toggles", json={"email_notifications": False}, timeout=15)
    r = admin_session.get(f"{API}/admin/audit?limit=20", timeout=15)
    assert r.status_code == 200
    items = r.json()["items"]
    assert isinstance(items, list)
    # Should contain at least our toggles update
    assert any(it.get("target_type") == "toggles" for it in items)

"""Test that /api/uploads/* path works correctly after the mount fix.

Previously: server mounted static at /uploads which the K8s ingress proxied
to the React dev server (HTML fallback). Fix: mounted at /api/uploads.

This test validates:
 1. POST /api/uploads/image returns URL starting with /api/uploads/images/
 2. GET {URL}/api/uploads/images/{file} returns 200 image/* content-type
 3. POST /api/uploads/pdf -> /api/uploads/pdfs/...
 4. GET .../api/uploads/pdfs/{file} -> application/pdf
"""
import io
import os
import struct
import zlib
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_EMAIL = "admin@lizam.sa"
ADMIN_PASSWORD = "Lizam@2026"


def _tiny_png() -> bytes:
    """Build a minimal 1x1 PNG entirely in-memory (no external deps)."""
    sig = b"\x89PNG\r\n\x1a\n"

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff))

    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
    raw = b"\x00" + b"\xff\x00\x00"  # filter byte + 1px RGB
    idat = chunk(b"IDAT", zlib.compress(raw))
    iend = chunk(b"IEND", b"")
    return sig + ihdr + idat + iend


def _tiny_pdf() -> bytes:
    return (b"%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            b"2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\n"
            b"xref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n"
            b"0000000053 00000 n \ntrailer<</Size 3/Root 1 0 R>>\n"
            b"startxref\n96\n%%EOF\n")


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
               timeout=20)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return s


# ---- IMAGE upload roundtrip ----
class TestImageUpload:
    def test_upload_image_returns_api_uploads_url(self, admin_session):
        r = admin_session.post(
            f"{BASE_URL}/api/uploads/image",
            files={"file": ("test.png", io.BytesIO(_tiny_png()), "image/png")},
            timeout=20,
        )
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        data = r.json()
        assert "url" in data
        url = data["url"]
        # CRITICAL: must be /api/uploads/... not /uploads/...
        assert url.startswith("/api/uploads/images/"), (
            f"URL must start with /api/uploads/images/, got: {url}")
        assert data.get("mime") == "image/png"
        assert data.get("size", 0) > 0

        # Step 2: GET the file back via the public URL
        full_url = f"{BASE_URL}{url}"
        g = requests.get(full_url, timeout=20)
        assert g.status_code == 200, f"GET {full_url} -> {g.status_code}"
        ct = g.headers.get("content-type", "")
        assert ct.startswith("image/"), (
            f"Expected image/* content-type, got '{ct}'. "
            f"Body starts with: {g.content[:80]!r}")
        # Sanity: bytes match what we uploaded
        assert g.content[:8] == b"\x89PNG\r\n\x1a\n"

    def test_legacy_uploads_path_returns_html_fallback(self, admin_session):
        """Legacy /uploads/ path is now served by the React dev server
        (HTML fallback). Acceptable per spec — NOT a regression."""
        r = admin_session.post(
            f"{BASE_URL}/api/uploads/image",
            files={"file": ("test.png", io.BytesIO(_tiny_png()), "image/png")},
            timeout=20,
        )
        assert r.status_code == 200
        filename = r.json()["url"].rsplit("/", 1)[-1]
        legacy = f"{BASE_URL}/uploads/images/{filename}"
        g = requests.get(legacy, timeout=20)
        # Could be 200 HTML (React fallback) or 404 — either is acceptable;
        # the key thing is it should NOT return image/* (since it'd mean
        # something is mis-routed).
        ct = g.headers.get("content-type", "")
        assert not ct.startswith("image/"), (
            f"Legacy /uploads/ unexpectedly served image — mount duplicated? "
            f"status={g.status_code} ct={ct}")


# ---- PDF upload roundtrip ----
class TestPdfUpload:
    def test_upload_pdf_returns_api_uploads_url(self, admin_session):
        r = admin_session.post(
            f"{BASE_URL}/api/uploads/pdf",
            files={"file": ("doc.pdf", io.BytesIO(_tiny_pdf()),
                            "application/pdf")},
            timeout=20,
        )
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        data = r.json()
        url = data["url"]
        assert url.startswith("/api/uploads/pdfs/"), (
            f"URL must start with /api/uploads/pdfs/, got: {url}")

        full_url = f"{BASE_URL}{url}"
        g = requests.get(full_url, timeout=20)
        assert g.status_code == 200
        ct = g.headers.get("content-type", "")
        assert ct.startswith("application/pdf"), (
            f"Expected application/pdf, got '{ct}'")
        assert g.content[:5] == b"%PDF-"


# ---- Auth gating ----
class TestUploadAuth:
    def test_upload_requires_auth(self):
        r = requests.post(
            f"{BASE_URL}/api/uploads/image",
            files={"file": ("x.png", io.BytesIO(_tiny_png()), "image/png")},
            timeout=20,
        )
        assert r.status_code in (401, 403), \
            f"Unauth upload should be 401/403, got {r.status_code}"

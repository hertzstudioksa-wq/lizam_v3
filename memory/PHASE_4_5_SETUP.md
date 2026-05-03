# Phase 4 + Phase 5 — Operational Setup Notes

This document explains how to enable the two integrations that are built-but-disabled-by-default in the LIZAM platform:
1. **Resend email delivery** (for contact-form and response-submission notifications)
2. **Google OAuth** — migration path from the Emergent-managed flow to a self-owned Google OAuth Client

> **Design choice:** Both integrations ship DISABLED so the platform runs cleanly out of the box. Storage (contact messages, research responses) and server-side auth still work perfectly without either integration.

---

## 1. Resend email (Phase 5)

**Status:** Structurally complete. Disabled by default.

When disabled (the default), `app.email_adapter.send_email()` returns `{ok: True, skipped: True, reason: "resend_not_configured"}`. Contact-form and response submissions always persist to MongoDB regardless — email is strictly additive.

### 1.1 Enable it

1. Sign up at https://resend.com (free tier: 3,000 emails/month, 100/day).
2. Verify your sending domain (e.g. `lizam.sa`) via DNS TXT records from the Resend dashboard.
3. Create an API key at https://resend.com/api-keys.
4. Add to `/app/backend/.env`:

   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   RESEND_FROM="LIZAM Center <noreply@lizam.sa>"
   ```

5. Flip the admin toggle `email_notifications = True` (at `/admin/toggles`).
6. Restart the backend: `sudo supervisorctl restart backend`.

### 1.2 What it sends

- New contact message → notification to `site_settings.contact_email` (fallback: `admin@lizam.sa`).
- New research response submitted → notification to `site_settings.contact_email`.

### 1.3 Template customisation

Templates are inline HTML in two places:
- `/app/backend/app/routers/public.py` — `public_submit_contact` (search for `<p><b>From:</b>`)
- `/app/backend/app/routers/responses.py` — `submit_response` (search for `New research response`)

Replace with richer HTML or migrate to a template file when needed.

### 1.4 Security note

Email sends are **best-effort**. The adapter swallows all exceptions (logged, not raised) so a Resend outage will NEVER break submissions. The "email failed" detail is only visible in backend logs, not exposed to the submitter.

---

## 2. Google OAuth — Emergent-managed (current)

**Status:** Built, toggle-gated, default OFF.

### 2.1 Enable for preview/testing

1. Admin → `/admin/toggles` → turn on **"Google login (deferred)"** (`feature_toggles.google_login`).
2. Save.
3. The `/login` page now shows a "Continue with Google" button.

The Emergent flow uses:
- Redirect URL: `https://auth.emergentagent.com/?redirect={window.location.origin}/login`
- Callback: Emergent appends `#session_id=<uuid>` to our return URL.
- Our `POST /api/auth/google/callback` exchanges the session_id with Emergent's `/auth/v1/env/oauth/session-data` endpoint for the profile, then upserts the LIZAM user and issues our standard JWT cookies.

No Google Client ID / Client Secret is required.

### 2.2 Migrating to a self-owned Google OAuth Client (production)

When LIZAM wants full ownership (required for production custody):

1. Create a Google Cloud project at https://console.cloud.google.com/.
2. Enable "Google+ API" (or just use OpenID Connect).
3. Create an **OAuth 2.0 Client ID** (Web application).
4. Authorized redirect URI: `https://lizam.sa/api/auth/google/callback-real`.
5. Add to `/app/backend/.env`:

   ```bash
   GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
   ```

6. In `/app/backend/app/routers/google_auth.py` — REPLACE only the "fetch profile" block:

   ```python
   # BEFORE (Emergent):
   async with httpx.AsyncClient(timeout=10.0) as client:
       r = await client.get(SESSION_DATA_ENDPOINT, headers={"X-Session-ID": session_id})
       profile = r.json()

   # AFTER (self-owned Google):
   from google.oauth2 import id_token
   from google.auth.transport import requests as g_requests
   idinfo = id_token.verify_oauth2_token(
       body.id_token, g_requests.Request(), os.environ["GOOGLE_CLIENT_ID"],
   )
   profile = {"email": idinfo["email"], "name": idinfo.get("name"), "picture": idinfo.get("picture")}
   ```

7. The rest (user upsert, JWT issuance, cookies, audit log) stays unchanged.
8. Frontend login button: replace `https://auth.emergentagent.com/?redirect=...` with Google's authorisation URL.

Packages needed: `pip install google-auth google-auth-oauthlib`.

### 2.3 Rate limiting

`POST /auth/google/callback` is rate-limited (20 calls / 5min / IP). Invalid session_ids don't leak timing info.

---

## 3. Rate limiting (Phase 4)

**Storage:** MongoDB collection `rate_limit_buckets` with a TTL index on `ttl_at` — self-cleaning.
**Multi-worker safe:** Yes (persisted in DB, not memory).

### 3.1 Current policies

| Endpoint | Max fails | Window | Lock |
|----------|-----------|--------|------|
| `POST /api/auth/login` | 5 | 5 min | 15 min |
| `POST /api/auth/google/callback` | 20 | 5 min | 15 min |
| `POST /api/public/contact` | 5 | 10 min | 30 min |
| `POST /api/public/publications/{slug}/responses` | 6 | 10 min | 30 min |

Keys are per-IP AND per-email (whichever trips first).

### 3.2 Manually unlock

```python
# /app/backend/ → python
from pymongo import MongoClient
c = MongoClient("mongodb://localhost:27017")
c["lizam_db"].rate_limit_buckets.delete_many({})
```

Or flush just one user:

```python
c["lizam_db"].rate_limit_buckets.delete_many({"key": {"$regex": "user@example.com"}})
```

---

## 4. Audit log (Phase 4)

**Storage:** MongoDB collection `admin_audit`, capped server-side to the most recent events returned by `/api/admin/audit`.

**Actions logged:**
- `login` (email/password + Google) — written on successful login
- `update` — site settings, branding, home content, toggles, images, user role, contact messages status
- `create` / `update` / `publish` / `archive` / `delete` — publications
- `moderate` / `delete` — research responses
- Per-target-type filtering via `?target_type=…&action=…`

Admin UI: `/admin/audit`.

Retention: no automatic rotation; for a legal research center we recommend keeping this indefinitely. Add a TTL later if needed.

---

## 5. Security hardening summary (Phase 4)

- **CORS:** restricted by `ALLOWED_ORIGIN_REGEX` in `/app/backend/app/config.py`. Credentials allowed only from configured origins.
- **Cookies:** `access_token` + `refresh_token` are HttpOnly + Secure + SameSite=None (required for the SPA on a different subdomain).
- **Role enforcement:** server-side via `require_permission()` dependency — no frontend-only gating.
- **Hidden publications:** `status != "published"` rows are filtered in every public endpoint.
- **Gated PDFs:** never served via raw public URLs — every download routes through `/api/public/publications/{id}/pdf` which issues a short-lived (~5 min) signed token, validated on the stream endpoint.
- **HTML sanitization:** TipTap output and response bodies pass through `bleach` with a strict allow-list (tags: `p, strong, em, u, s, h2–h6, ul, ol, li, blockquote, a, br, hr`; attrs: `href, title, class`; protocols: `http, https, mailto` — `data:` explicitly stripped).
- **Brute-force:** Mongo-backed rate limiter, per-IP + per-identifier, with exponential back-off via longer lock windows on repeat abuse.

---

## 6. SEO / metadata (Phase 4 — basics)

Currently handled by:
- `site_settings.site_name_ar/_en` and `tagline_ar/_en` consumed by `<title>` via `BrandThemeSync` in `App.js`.
- `<html lang>` + `<html dir>` flip with the language toggle (correct for Arabic RTL).

**Deferred to a future iteration:**
- Per-page `<meta description>` and `<meta og:*>` tags (requires `react-helmet-async` or equivalent).
- `<link hreflang>` for AR/EN.
- Publication-specific structured data (JSON-LD `ScholarlyArticle`).

Current state is acceptable for a pre-launch research center but should be upgraded before SEO campaigns.

---

## 7. Known limitations (honest list)

| Area | Limitation | Workaround |
|------|-----------|------------|
| Response attachments | Not supported this phase (user requested text-only) | DB schema supports future addition via `attachment_url` field |
| Custom font upload | UI placeholder only | Admin must pick from curated Thmanyah/IBM Plex/Inter list |
| Email delivery | Disabled without Resend key | Contact/response flows still persist to DB |
| Google OAuth in production | Emergent-managed (shared infra) | Migration notes in §2.2 above |
| Audit log retention | No automatic rotation | Manual Mongo TTL index can be added |
| Per-page meta tags | Not implemented | Basic `<title>` + `<html lang>` work |
| Rate limiter | Mongo-backed — not Redis | Acceptable for current scale; Redis upgrade is 1 file change |

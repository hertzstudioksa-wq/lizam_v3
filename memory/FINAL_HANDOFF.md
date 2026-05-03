# LIZAM — Final Functional Freeze & Handoff Package

**Status:** Functional freeze. Theme A is the stable public baseline. Theme B is available but NOT visually final-approved. Phases 1, 2, 3, 4, 5 are functionally complete and tested. Visual redesign work is paused per the project owner.

**Last freeze date:** Feb 2026
**Test status at freeze:** 100/100 backend tests passing (`pytest tests/`).

---

## 1. Current system overview

LIZAM is an Arabic-first, bilingual (AR-RTL primary / EN-LTR secondary) website + CMS for the LIZAM Center for Legal Research (Saudi Arabia). It supports rich publication management with TipTap RTL/LTR editing, gated PDF delivery, role-based admin moderation, research-response workflows, contact inbox, image-asset slot management, and a theme system that lets the institution swap visual directions without code changes.

Stack: **React 19** (CRA) + **TailwindCSS** + **shadcn/ui** + **TipTap** + **i18next** on the frontend; **FastAPI** + **Pydantic v2** + **Motor** + **bleach** + **httpx** + custom Mongo-backed rate limiter on the backend; **MongoDB** for storage. Auth via httpOnly JWT cookies. Optional Google OAuth via Emergent-managed flow. Optional email delivery via Resend (disabled until `RESEND_API_KEY` provided).

---

## 2. Architecture summary

```
┌─────────────────────────────────────────────────────────────┐
│                  React SPA (port 3000)                      │
│  Public site  ⇆  AuthContext  ⇆  /admin (CMS)               │
│   PublicLayout (Theme A | Theme B)   AdminLayout            │
└────────────────────────┬────────────────────────────────────┘
                         │ /api/* (axios, withCredentials)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI server (port 8001)                     │
│  /api  ─ auth ─ google_auth ─ public ─ responses ─ admin    │
│        ─ uploads ─ image_assets                             │
│  Cross-cutting: security.py, sanitize.py, rate_limit.py,    │
│                 email_adapter.py, seed.py                   │
└────────────────────────┬────────────────────────────────────┘
                         │ Motor (asyncio)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                       MongoDB (lizam_db)                    │
│  users, roles, publications, authors, categories,           │
│  site_settings, home_content, image_assets,                 │
│  research_responses, contact_messages, admin_audit,         │
│  rate_limit_buckets, sessions                               │
└─────────────────────────────────────────────────────────────┘
```

**Process supervisor:** `supervisord` manages backend (port 8001) and frontend dev (port 3000). Hot-reload enabled for both. K8s ingress routes `/api/*` to backend, everything else to frontend.

---

## 3. Backend modules summary

| Path | Responsibility |
|------|---|
| `/app/backend/server.py` | FastAPI app factory, lifespan (seed on startup), CORS, router registration |
| `/app/backend/app/config.py` | Mongo client, role permissions, allowed CORS origins |
| `/app/backend/app/security.py` | JWT issuance/verification, bcrypt, role guards, PDF token signer, audit-log helper |
| `/app/backend/app/sanitize.py` | bleach allow-lists for TipTap output and free-text inputs |
| `/app/backend/app/rate_limit.py` | Mongo-backed brute-force protection (TTL-indexed) |
| `/app/backend/app/email_adapter.py` | Resend adapter — no-op when key unset |
| `/app/backend/app/seed.py` | Idempotent seeding (`_seed_origin="system-seed"` guard preserves admin edits) |
| `/app/backend/app/models.py` | Pydantic input/output models |
| `/app/backend/app/routers/auth.py` | Email/password login, register, refresh, logout, /me |
| `/app/backend/app/routers/google_auth.py` | Emergent-managed Google login (toggle-gated) |
| `/app/backend/app/routers/public.py` | Public site data: site-settings, home, publications, image-assets, contact form |
| `/app/backend/app/routers/responses.py` | Public response submission + admin moderation |
| `/app/backend/app/routers/admin.py` | All `/admin/*` CMS endpoints + audit log + messages |
| `/app/backend/app/routers/uploads.py` | Image and PDF file uploads |
| `/app/backend/app/routers/image_assets.py` | Image-slot CRUD for admin |

---

## 4. Frontend modules summary

| Path | Responsibility |
|------|---|
| `/app/frontend/src/App.js` | Routes, AuthProvider, LanguageProvider, theme sync |
| `/app/frontend/src/auth/AuthContext.jsx` | Cookie-based JWT session state |
| `/app/frontend/src/i18n/LanguageContext.jsx` | AR/EN switch, html dir/lang |
| `/app/frontend/src/lib/api.js` | Axios instance with `REACT_APP_BACKEND_URL` + `/api` prefix |
| `/app/frontend/src/hooks/useSiteSettings.js` | Public site/home content + branding |
| `/app/frontend/src/hooks/useTheme.js` | Reads `active_theme` → applies `data-theme` |
| `/app/frontend/src/hooks/useImageAssets.js` | Image-slot lookup |
| `/app/frontend/src/hooks/usePublications.js` | Publications list+detail fetch |
| `/app/frontend/src/components/layout/PublicLayout.jsx` | Conditionally renders Theme A or B chrome |
| `/app/frontend/src/components/layout/Header.jsx`, `Footer.jsx` | Theme A chrome |
| `/app/frontend/src/components/theme-b/*.jsx` | Theme B variants (Header, Footer, Hero, About, MissionVision, Objectives, FieldsOfWork, FeaturedPublications, ContactBlock, PublicationCard, PullBand) |
| `/app/frontend/src/styles/theme-b.css` | Theme B CSS tokens scoped to `html[data-theme="b"]` |
| `/app/frontend/src/pages/*.jsx` | Public pages (Home, Publications, Detail, Contact, Login, Account) |
| `/app/frontend/src/admin/AdminLayout.jsx` | CMS shell + sidebar navigation |
| `/app/frontend/src/admin/pages/*.jsx` | All CMS pages (15 of them, see §5) |
| `/app/frontend/src/admin/components/*.jsx` | Shared admin UI primitives + TipTap editor wrapper |

---

## 5. CMS modules summary

Routes under `/admin/*` (all role-guarded):

| Route | Purpose |
|------|---|
| `/admin` | Overview dashboard (counts + recent activity) |
| `/admin/settings` | Bilingual site name, tagline, contact, social, footer |
| `/admin/branding` | Theme selector (A/B), font management, logos, colors |
| `/admin/images` | Image-slot management (preview, dimensions, alt text, active toggle) |
| `/admin/home` | Hero, about, mission, vision, objectives, fields of work, visible sections |
| `/admin/publications` | List + create + edit (TipTap RTL/LTR, PDF upload, access level) |
| `/admin/authors` | Researcher/author profiles |
| `/admin/categories` | Field/category taxonomy |
| `/admin/responses` | Research-response moderation (filter, approve, reject, archive, notes) |
| `/admin/messages` | Contact inbox (filter, mark read, archive) |
| `/admin/users` | User accounts + role assignment |
| `/admin/roles` | Role keys + permissions |
| `/admin/toggles` | Feature toggles |
| `/admin/audit` | Admin activity log with filters |

---

## 6. Public website routes

| Route | Purpose |
|------|---|
| `/` | Homepage (theme-aware) |
| `/publications` | Listing with search/filter |
| `/publications/:slug` | Detail page (article + responses tab + cite + PDF + share) |
| `/contact` | Contact form |
| `/login` | Email/password (+ optional Google button) |
| `/register` | Account creation |
| `/account` | Logged-in user dashboard (role-guarded) |
| `/policy`, `/privacy`, `/terms` | Static placeholders (toggle-gated) |
| `/about` | (currently routes through homepage anchor) |

---

## 7. Admin dashboard routes

See §5 above. All require server-side `require_permission()` checks; the frontend nav items are role-aware via `useAuth().user.role`.

---

## 8. API endpoint summary (representative)

**Auth:**
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/auth/me`, `POST /api/auth/refresh`
- `GET /api/auth/google/status`, `POST /api/auth/google/callback`

**Public:**
- `GET /api/public/site-settings` · `GET /api/public/home-content`
- `GET /api/public/publications` (list with filters/pagination)
- `GET /api/public/publications/{slug}` (detail incl. _gated, related)
- `GET /api/public/publications/{id}/pdf` (issues short-lived stream token)
- `GET /api/public/publications/{slug}/responses` (approved + public_visible only)
- `POST /api/public/publications/{slug}/responses` (rate-limited submission)
- `POST /api/public/contact` (rate-limited)
- `GET /api/public/image-assets` (active slots)

**Admin** (role-guarded):
- `GET /api/admin/overview`
- `GET/PATCH /api/admin/site-settings` · `GET/PATCH /api/admin/branding`
- `GET/PATCH /api/admin/home` · `GET/PATCH /api/admin/toggles`
- `GET/POST/PATCH/DELETE /api/admin/publications/*`
- `GET/POST/PATCH/DELETE /api/admin/authors`, `/categories`, `/users`, `/roles`
- `GET/PATCH/DELETE /api/admin/responses/*`
- `GET /api/admin/messages` · `PATCH /api/admin/messages/{id}`
- `GET/PATCH /api/admin/image-assets`
- `GET /api/admin/audit`
- `POST /api/uploads/image` · `POST /api/uploads/pdf`

---

## 9. Database collections/models summary

| Collection | Fields (key ones) | Owner |
|-----------|-------------------|-------|
| `users` | id, email, name, password_hash, role, role_key, status, auth_provider, picture | seed/admin |
| `roles` | key, name_ar/en, permissions[] | seed |
| `site_settings` | id="site", site_name_ar/en, tagline_ar/en, default_language, active_theme, contact_email, address, social_links, feature_toggles | seed/admin |
| `branding` | primary/secondary/accent/background colors, fonts, logos, favicon | seed/admin |
| `home_content` | id="home", hero_*, about, mission, vision, objectives[], fields_of_work[], visible_sections | seed/admin |
| `publications` | id, slug_ar, slug_en, title_ar/en, summary_ar/en, content_html_ar/en, preview_html_ar/en, publication_type, category_id, author_ids[], tags[], status, access_level, pdf_access_level, pdf_url, view_count, reading_time_minutes, published_at, responses_enabled | seed/admin |
| `authors` | id, name_ar/en, bio_ar/en, photo_url, sort_order | seed/admin |
| `categories` | id, name_ar/en, slug, sort_order | seed/admin |
| `image_assets` | slot_key, url, alt_ar/en, active, recommended_width/height, aspect_ratio, usage_note_ar/en | seed/admin |
| `research_responses` | id, publication_id, title, body_html, author_name, author_email, author_user_id, status, public_visible, internal_notes, consent, submitted_at, approved_at, approved_by | public/admin |
| `contact_messages` | id, name, email, subject, message, status, created_at | public/admin |
| `admin_audit` | ts, actor_email, action, target_type, target_id, details | system |
| `rate_limit_buckets` | key, fails_ms[], lock_until_ms, ttl_at | system (TTL-indexed) |
| `sessions` | refresh-token tracking | system |

All MongoDB reads exclude `_id` via projection. Pydantic response models prevent ObjectId leakage. Seed-owned records carry `_seed_origin="system-seed"`; admin-edited records flip to `_seed_origin="admin"` and are never overwritten on restart.

---

## 10. Feature toggles summary

`site_settings.feature_toggles` (admin-editable at `/admin/toggles`):

| Key | Default | Effect |
|-----|---------|--------|
| `registration` | true | Allow new account registration |
| `gated_content` | true | Enforce access levels on publications |
| `google_login` | **false** | Show "Continue with Google" on /login |
| `research_responses` | true | Master switch for response submissions |
| `public_responses` | true | Show approved responses publicly |
| `authors_public_page` | false | Author profile pages on public site |
| `contact_form` | true | Enable /contact submission |
| `featured_publications` | true | Show featured band on homepage |
| `policy_pages` | false | Show /policy /privacy /terms |
| `pdf_download` | true | Enable PDF tokenized streaming |
| `social_icons` | true | Footer social icons |
| `email_notifications` | **false** | Send Resend emails (requires API key) |

Per-publication toggles: `responses_enabled`, `is_featured`.

---

## 11. Auth and roles summary

**Auth method:** Email/password → bcrypt hash → JWT access (15min) + refresh (7d) cookies (HttpOnly, Secure, SameSite=None).
**Optional:** Emergent-managed Google login (toggle-gated, default off).

**Roles** (`config.py`):
- `super_admin` — wildcard `*` (all permissions)
- `admin` — full CMS minus role/permission management
- `editor` — publications + responses moderation
- `reviewer` — responses moderation only
- `registered` — public + may submit responses (no admin access)

**Permission keys** are granular (`publications.read`, `publications.write`, `responses.moderate`, `settings.edit`, `users.manage`, `messages.read`, etc.). Server-side enforcement via `require_permission(key)` FastAPI dependency.

---

## 12. Google login setup notes

**Status:** Built, toggle-gated, default OFF.

**To enable on the current Emergent-managed flow:**
1. Admin → `/admin/toggles` → turn on **Google login**.
2. Save.
3. Login page now shows "Continue with Google" button. No Google credentials required.

**To migrate to a self-owned Google OAuth Client (production custody):**
See `/app/memory/PHASE_4_5_SETUP.md` §2.2. The user upsert + JWT issuance code stays unchanged; only the "fetch profile" block in `google_auth.py` swaps out (~10 lines).

---

## 13. Resend / email setup notes

**Status:** Built, DISABLED by default.

**Enable:**
1. Get API key at https://resend.com/api-keys.
2. Verify your sending domain.
3. Add to `/app/backend/.env`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   RESEND_FROM="LIZAM Center <noreply@lizam.sa>"
   ```
4. Admin `/admin/toggles` → flip `email_notifications` ON.
5. `sudo supervisorctl restart backend`.

**Behavior when disabled:** `send_email()` returns `{ok:True, skipped:True}`. Contact + response submissions still persist to MongoDB.

**What it sends:**
- New contact message → notification to `site_settings.contact_email`.
- New research response → notification to `site_settings.contact_email`.

Templates are inline HTML in `routers/public.py` (contact) and `routers/responses.py` (response submission).

---

## 14. PDF token / gating summary

**Storage:** PDFs uploaded via `/api/uploads/pdf` to disk under `/app/backend/uploads/`. URL stored on the publication.

**Access flow:**
1. Frontend calls `GET /api/public/publications/{id}/pdf`.
2. Backend checks the publication's `access_level` and `pdf_access_level` against the current user (anonymous / registered / member).
3. If allowed, backend signs a short-lived (~5 min) HMAC token tied to publication id + user id (or anonymous IP) and returns `{stream_url, token, title}`.
4. Frontend opens `stream_url` in a new tab.
5. Stream endpoint validates the token before streaming bytes.

**Gated raw URLs are NEVER served publicly.** Even if the underlying PDF URL is leaked, downloads require a fresh token.

---

## 15. Research responses workflow summary

Lifecycle: `submitted → under_review → approved | rejected | archived`.

**Public submission** (`POST /api/public/publications/{slug}/responses`):
- Respects global `feature_toggles.research_responses` and per-publication `responses_enabled`.
- Requires consent checkbox.
- Body HTML is sanitized (script/on*/data: stripped).
- Rate limit: 6 fails / 10 min / 30 min lock per IP + per email.
- Stores with `status="submitted"`, `public_visible=False`.

**Admin moderation** (`/admin/responses`, requires `responses.moderate`):
- Filter by status, click row → detail panel.
- Actions: Mark under review · Approve & publish · Reject · Archive · Delete.
- Internal notes (admin-only).
- Public visible toggle (auto-set on Approve).
- Audit-logged.

**Public display** (`GET /api/public/publications/{slug}/responses`):
- Returns only `status="approved"` AND `public_visible=true`, sorted by `approved_at` desc.
- Surfaces on the publication detail page's Responses tab.

---

## 16. Contact workflow summary

**Public** (`POST /api/public/contact`):
- Fields: name, email, subject, message, consent.
- Validates consent + email format.
- Rate-limited (5/10min/30min lock).
- Stores in `contact_messages` with `status="new"`.
- Best-effort Resend notification to `site_settings.contact_email`.

**Admin** (`/admin/messages`):
- Inbox table with status filter (All/New/Read/Archived).
- Per-row actions: Mark read · Archive.
- Each status change writes an `admin_audit` entry.

---

## 17. Audit log summary

**Storage:** `admin_audit` collection. Fields: `ts, actor_email, action, target_type, target_id, details`.

**Actions logged:**
- `login` (email/password + Google)
- `update` — settings, branding, home, toggles, images, users, roles, messages, image_assets
- `create / update / publish / archive / delete` — publications
- `moderate / delete` — research responses

**Admin UI** (`/admin/audit`):
- Most-recent-first table.
- Filter by `target_type` and `action`.
- Shows JSON details payload per row.

**Retention:** unbounded by default (recommended for a research center). Add a Mongo TTL index later if you need rotation.

---

## 18. Image management summary

**Backend:** `image_assets` collection + `/admin/image-assets` (admin) + `/public/image-assets` (public consumers).

**5 seeded slots** (admin can edit, never overwritten by re-seed):
| slot_key | Used by | Recommended | Aspect |
|----------|---------|-------------|--------|
| `hero_background` | Hero image panel (Theme B) | 2400×1400 | 12:7 |
| `about_image` | About paired image | 1600×2000 | 4:5 |
| `featured_band_background` | Featured publications band | 2400×1200 | 2:1 |
| `objectives_background` | Objectives section bg (active=false default) | 2400×1400 | 12:7 |
| `publications_hero` | /publications page banner | 2400×900 | 8:3 |

**Admin UI** (`/admin/images`):
- Live preview at correct aspect ratio.
- Recommended dimensions + aspect chip.
- AR + EN usage notes.
- AR + EN alt text.
- Active/inactive toggle.
- URL paste OR file upload.
- Save per-slot.

**Frontend consumption:** `useImageAssets()` hook with module-level cache; admin save invalidates via `resetImageAssetsCache()`.

---

## 19. Theme system summary

**Two themes coexist; switchable from `/admin/branding`:**

- **Theme A — Stable Baseline (DEFAULT after freeze)**
  - Components: `/app/frontend/src/components/layout/Header.jsx`, `Footer.jsx`; sections under `/app/frontend/src/components/home/*.jsx`.
  - Visual direction: split-screen navy/ivory hero, classical editorial cards.
  - **This is the production-ready visual.**

- **Theme B — Premium Editorial (NOT visually approved as final)**
  - Components: `/app/frontend/src/components/theme-b/*.jsx`.
  - CSS tokens: `/app/frontend/src/styles/theme-b.css` scoped to `html[data-theme="b"]`.
  - Visual direction: split asymmetric hero with image panel, refined radius system, gold accents, atmospheric imagery, paired warm/dark Mission-Vision panels.
  - Available via the admin theme selector but **the project owner has explicitly stated the visual direction is not final-approved**. Future redesign will replace or refine this without touching backend.

**How it works:**
- `site_settings.active_theme` (Literal["A","B"]) is the single source of truth.
- `useTheme()` reads it from public site-settings → sets `<html data-theme="a"|"b">`.
- `PublicLayout`, `HomePage`, and `PublicationCard` branch on the theme value to render the right component variant.
- Theme A and B share the same data, hooks, and CMS — only chrome and sections differ.

---

## 20. Font management summary

**Default:** Self-hosted **Thmanyah** family (Sans for UI/body, Serif Display for editorial headings, Serif Text for long-form reading).

**Files:** `/app/frontend/public/fonts/thmanyah/*.woff2` (15 files), declared in `/app/frontend/public/fonts/thmanyah.css`, preloaded in `index.html`.

**Admin UI** (`/admin/branding` → Font management):
- Active Arabic font selector (default Thmanyah Sans)
- Active English font selector
- Live AR + EN preview blocks
- "Revert to default Thmanyah" link
- "Custom font upload — pending" notice (DB schema supports `font_ar`/`font_en` strings; upload+`@font-face` injection is **deferred to a future iteration**)

**Fallbacks:** IBM Plex Sans Arabic, Source Serif 4, Inter (declared in CSS).

**Licensing:** **Thmanyah commercial-embedding rights have NOT been verified** — confirm with the type foundry before public launch.

---

## 21. Current known limitations

| Area | Limitation | Notes |
|------|-----------|-------|
| Theme B visual | Not final-approved by project owner | Theme A is the production baseline |
| Custom font upload | UI placeholder only | DB schema ready; `@font-face` injection deferred |
| Response attachments | Not supported | Text-only by user direction; DB extensible |
| Resend email | No-op until `RESEND_API_KEY` set | All flows still work without it |
| Google OAuth | Uses Emergent-managed shared infrastructure | Migrate to self-owned Client for production custody (notes in PHASE_4_5_SETUP.md §2.2) |
| Audit log retention | Unbounded | Add TTL index if needed |
| Per-page meta tags | Only global `<title>` | Open Graph, Twitter Card, hreflang, JSON-LD ScholarlyArticle deferred |
| Thmanyah licensing | Not legally confirmed | Verify before public launch |
| Email templates | Inline HTML strings | Move to template files when copy becomes complex |
| Response notifications | Only to admin | No subscriber/digest system yet |
| Rate limiter | Mongo-backed, not Redis | Acceptable for current scale |

---

## 22. Production readiness checklist

- [x] Email/password auth + JWT cookies
- [x] Role-based access control (server-side)
- [x] Brute-force protection (Mongo-backed rate limiter)
- [x] HTML sanitization on all user-generated content
- [x] Tokenized PDF delivery
- [x] Hidden / draft publications never exposed publicly
- [x] HttpOnly + Secure + SameSite=None cookies
- [x] CORS restricted by regex
- [x] Audit logging on all admin mutations
- [x] Seed idempotency (admin edits preserved)
- [x] All 100/100 backend tests passing
- [ ] Resend API key configured (optional, but recommended)
- [ ] Google OAuth migrated to self-owned Client (recommended for production custody)
- [ ] Thmanyah font commercial license confirmed
- [ ] Admin password rotated from default `Lizam@2026`
- [ ] Per-page SEO meta tags + JSON-LD added (recommended pre-launch)

---

## 23. Deployment checklist

- [ ] Set environment variables (see §29).
- [ ] Verify MongoDB connection and indexes (auto-created on first request).
- [ ] Verify Mongo TTL index on `rate_limit_buckets.ttl_at` and `image_assets.slot_key` (auto-created).
- [ ] Run backend: supervisor manages it; `sudo supervisorctl restart backend`.
- [ ] Build frontend: `cd /app/frontend && yarn build` (currently dev mode in preview).
- [ ] Confirm `/api/health` returns 200 (if added) — currently rely on `/api/public/site-settings`.
- [ ] Run smoke tests: login, list publications, submit a contact message.
- [ ] Rotate the seeded super_admin password.
- [ ] Verify Thmanyah font loads (DevTools → Network → check `.woff2` 200s).
- [ ] Confirm theme persists after admin edit + page refresh.
- [ ] Confirm tokenized PDF download works for both registered and public publications.

---

## 24. Security checklist

- [x] Cookies: HttpOnly + Secure + SameSite=None
- [x] CORS restricted (`ALLOWED_ORIGIN_REGEX` in `config.py`)
- [x] Bcrypt password hashing
- [x] Server-side role/permission enforcement (no frontend-only gating)
- [x] HTML sanitizer with strict allow-list (script + on* + data: protocol stripped)
- [x] Mongo-backed rate limiter on login, contact, response submit, Google callback
- [x] Tokenized PDF streaming (HMAC-signed, ~5 min TTL)
- [x] Hidden + draft publications filtered in every public endpoint
- [x] Audit log on every admin mutation
- [x] Pydantic Literal/EmailStr validation on inputs
- [ ] CSP / strict transport security headers — **not yet configured** (add to ingress or middleware)
- [ ] CAPTCHA on contact / response forms — **not yet configured** (rate limiter is the current defense)
- [ ] Default super_admin credentials — **MUST be rotated before production**

---

## 25. Testing summary

**Backend:** `pytest /app/backend/tests/` → **100/100 passing** in ~30s.

| Suite | Tests | Coverage |
|-------|-------|----------|
| `test_lizam_backend.py` | core seed + site settings | Phase 1 |
| `test_lizam_phase2.py` | content + publications + view counts | Phase 2 |
| `test_lizam_phase3.py` | CMS hardening, sanitization, PDF tokens, seed idempotency | Phase 3 |
| `test_theme_b.py` | active_theme switching, none-value handling | Theme B infra |
| `test_image_assets.py` | image-slot endpoints, admin gating | Image management |
| `test_phase4_phase5.py` | rate limiter, contact, responses, Google toggle, audit | Phase 4 + 5 |

**conftest.py** clears `rate_limit_buckets` between tests (function-scoped autouse) so brute-force protection doesn't cascade across tests.

**Frontend:** validated via `testing_agent_v3_fork` iterations 1–6; iteration 6 returned 100% on all flows tested (login, theme switching, CMS round-trips, response moderation, contact form, audit log render, mobile menu, public response display).

---

## 26. How to continue frontend redesign later without breaking backend

The visual layer is **fully decoupled** from the backend.

**Hard rules:**
1. **DO NOT modify** any file under `/app/backend/` for visual changes.
2. **DO NOT modify** any field name returned by `/api/*` endpoints for visual changes.
3. **DO NOT modify** any data-testid attribute (testing agents rely on them).

**Safe surfaces for redesign:**
- Replace any component under `/app/frontend/src/components/theme-b/*.jsx` with new versions.
- Add a Theme C: create `/app/frontend/src/components/theme-c/*.jsx` and `/app/frontend/src/styles/theme-c.css`, then extend `useTheme()` and the literal in `app/models.py` (`Literal["A","B","C"]`) + admin selector.
- Tweak Tailwind config or add new utility classes — won't break anything.
- Replace static images via `/admin/images` — no code change needed.

**Workflow for a Figma → React redesign:**
1. Implement the new layouts in a new branch using only the data exposed by `useSiteSettings()`, `useHomeContent()`, `usePublications()`, `useImageAssets()`, `useAuth()`.
2. Mount under a new theme key (Theme C) — keep Themes A & B intact for fallback.
3. Run `pytest tests/` after every change; if any test breaks, you've touched backend territory.
4. Use the existing test-id attributes; don't rename them.

---

## 27. Where to change frontend theme files / components

| What | Where |
|------|-------|
| Theme B chrome | `/app/frontend/src/components/theme-b/HeaderB.jsx`, `FooterB.jsx` |
| Theme B sections | `/app/frontend/src/components/theme-b/Hero|About|MissionVision|Objectives|FieldsOfWork|FeaturedPublications|ContactBlock|PullBand B.jsx` |
| Theme B publication card | `/app/frontend/src/components/theme-b/PublicationCardB.jsx` |
| Theme B CSS tokens | `/app/frontend/src/styles/theme-b.css` |
| Theme A chrome | `/app/frontend/src/components/layout/Header.jsx`, `Footer.jsx` |
| Theme A sections | `/app/frontend/src/components/home/*.jsx` |
| Public page shells | `/app/frontend/src/pages/HomePage.jsx`, `PublicationsListPage.jsx`, `PublicationDetailPage.jsx`, `ContactPage.jsx` |
| Layout switcher | `/app/frontend/src/components/layout/PublicLayout.jsx` |
| Theme infrastructure | `/app/frontend/src/hooks/useTheme.js`, `/app/frontend/src/admin/pages/BrandingAdmin.jsx` |
| Tailwind config | `/app/frontend/tailwind.config.js` |
| Global styles | `/app/frontend/src/index.css`, `App.css` |

---

## 28. Where to plug a future Figma / frontend redesign

1. Create a new theme directory: `/app/frontend/src/components/theme-c/`.
2. Add `/app/frontend/src/styles/theme-c.css` with tokens scoped to `html[data-theme="c"]`.
3. In `/app/backend/app/models.py`, extend `SiteSettingsIn.active_theme` literal to `Literal["A","B","C"]`.
4. In `/app/frontend/src/admin/pages/BrandingAdmin.jsx`, add a third theme card.
5. In `/app/frontend/src/components/layout/PublicLayout.jsx` and `/app/frontend/src/pages/HomePage.jsx`, switch on `theme === "C"`.
6. Implement new section components consuming the existing hooks and data shape (no backend changes).
7. Keep test-id attributes identical to A/B equivalents.
8. Run `pytest tests/` to confirm zero regressions.
9. Submit for visual review. If approved, set as default in `seed.py` and reseed.

This pattern keeps the entire backend, CMS, and data layer **completely untouched**, so visual iteration can happen without functional risk.

---

## 29. List of environment variables needed

**`/app/backend/.env`** (DO NOT add comments inside):
| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGO_URL` | ✅ | MongoDB connection string |
| `DB_NAME` | ✅ | MongoDB database name (currently `lizam_db`) |
| `JWT_SECRET` | ✅ | Signing key for JWT cookies |
| `PDF_TOKEN_SECRET` | ✅ | HMAC key for PDF stream tokens |
| `ALLOWED_ORIGIN_REGEX` | ✅ | CORS allowlist regex |
| `RESEND_API_KEY` | optional | Enables email delivery |
| `RESEND_FROM` | optional | "From" address for Resend |
| `GOOGLE_CLIENT_ID` | optional (future) | Self-owned Google OAuth (post-migration) |
| `GOOGLE_CLIENT_SECRET` | optional (future) | Same as above |

**`/app/frontend/.env`**:
| Variable | Required | Purpose |
|----------|----------|---------|
| `REACT_APP_BACKEND_URL` | ✅ | Public-facing API base URL (e.g. `https://lizam.sa`) |
| `WDS_SOCKET_PORT` | dev only | Dev server hot-reload socket |

---

## 30. Test credentials location and reminder

**File:** `/app/memory/test_credentials.md`
**Current credentials:**
- Super Admin: `admin@lizam.sa` / `Lizam@2026`

**🔴 BEFORE PRODUCTION LAUNCH:**
1. Sign in as super_admin.
2. `/admin/users` → edit your account → change password to a strong production password.
3. Optionally create additional `editor` / `reviewer` accounts.
4. Update `/app/memory/test_credentials.md` ONLY with non-production preview credentials.
5. Rotate `JWT_SECRET` and `PDF_TOKEN_SECRET` in `.env` for production deployment (this will invalidate all existing sessions and PDF tokens, which is the desired security behavior).

---

## Confirmation summary

- ✅ Latest test status: **100/100 backend tests passing** (Feb 2026).
- ✅ Current stable default theme: **Theme A** (set in seed + applied to live `site_settings`).
- ⚙️ External configuration still needed: Resend API key (optional), self-owned Google Client (recommended for production custody), Thmanyah font license confirmation.
- ⚠️ Known production risks: default super_admin password not yet rotated, Thmanyah license not confirmed, no per-page meta tags / structured data yet.
- 🛑 No new features were added in this freeze step — only documentation + the harmless default-theme switch (B → A) per project owner direction.

**Visual frontend redesign remains paused. Theme B is available but NOT final-approved. Phase 6 work is on hold pending explicit approval.**

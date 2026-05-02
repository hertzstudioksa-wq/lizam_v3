# LIZAM — Center for Legal Research · PRD

## Project brief

**Arabic name** (seeded, editable from CMS): مركز لزام للدراسات القانونية
**English name** (seeded, editable from CMS): LIZAM Center for Legal Research

A bilingual (Arabic-first RTL / English LTR) institutional website + CMS for a Saudi legal research center. Public experience is editorial, calm, and institutionally serious. CMS (Phase 3) is flexible and scalable.

Full raw PRD: https://customer-assets.emergentagent.com/job_lizam-legal/artifacts/25ric7d4_LIZAM_Website_PRD_v1.md

## User personas
- **Public reader** — legal researchers, lawyers, academics, policy researchers, government and private-sector decision-makers
- **Registered user** — unlock gated content + submit research responses
- **Editor / Reviewer** — CMS authoring and moderation
- **Admin / Super Admin** — full CMS + branding + roles + toggles

## Core requirements (static)
- Arabic-first RTL, English-secondary LTR with professional localization
- Editorial, institutional design suitable for a Saudi legal research center
- Everything editable from CMS: names, logo, colors, fonts, sections, toggles
- Roles: super_admin / admin / editor / reviewer / registered
- Publications: bilingual HTML + PDF, preview/gated access, access levels, PDF rules, tags, views, reading time, related, responses
- Admin dashboard with metrics + full module surfaces
- Feature toggles (registration, gated content, Google login, responses, public responses, Authors public page, contact form, policy pages, PDF download, social icons, featured_publications)

## Tech stack
- Backend: FastAPI + MongoDB (motor), JWT httpOnly cookies, bcrypt
- Frontend: React 19 + React Router 7 + Tailwind + shadcn/ui (selective), Lucide icons
- i18n: lightweight custom `LanguageProvider` with per-content bilingual fields from backend
- Fonts: **Thmanyah Sans** (UI/body), **Thmanyah Serif Display** (editorial headings), **Thmanyah Serif Text** (long-form reader) — self-hosted in `/app/frontend/public/fonts/thmanyah/`; Inter + Source Serif 4 as fallbacks
- Logo: `/app/frontend/public/brand/lizam-logo.png` (+ `lizam-logo-light.png` + `lizam-mark.png` + favicons)

## Implementation history

### Phase 1 (May 2026) — Foundation & Visual Checkpoint ✅
- Site Settings + Home Content singletons (bilingual)
- Publications metadata (full fields)
- Authors, Categories, Roles, Super Admin seeded
- Auth scaffolding (register/login/me/logout/refresh) — JWT httpOnly cookies
- Public read API + Admin overview with role guard
- LanguageProvider AR-first with `dir`/`lang` sync
- Header, Footer, Hero section, Admin shell, Login/Register/Account pages
- Backend: 16/16 tests passing
- Visual checkpoint approved

### Phase 2 (May 2026) — Public Site & Publications ✅
**Refinements applied:**
- Thmanyah typeface family (self-hosted) replaces IBM Plex Arabic
- Arabic microcopy: "تأسس" → "مقرّه المملكة العربية السعودية"
- Footer: "مركز بحثي متخصص في الدراسات القانونية والسياسات العامة"
- Full PRD-derived content seeded for About, Mission, Vision, Objectives, Fields of Work (AR first, polished EN)

**Homepage sections built:**
- Hero (refined)
- About (editorial two-column)
- Mission & Vision (side-by-side with point lists)
- Objectives (navy-on-navy numbered editorial list with brass accents)
- Fields of Work (bordered grid with icons)
- Featured Publications (top 3)
- Contact (with CTA to form)

**Publications experience:**
- Publications listing page with: search (debounced), category filter, type filter, sort (latest/oldest/most viewed), empty state, total counter, sticky filters bar
- Publication card component: type · date · access badge · title · summary · tags · views · reading time · arrow CTA
- Publication detail page: breadcrumb, type eyebrow, title, summary, full meta rail (researcher/published/updated/reading time/views/access), action bar (PDF download, copy link, Twitter/LinkedIn/email share), tabs (Article / Responses), gated preview with login CTA, related publications section
- Contact page with form (dashboard-storage mode; email delivery deferred)

**Backend Phase 2 additions:**
- `GET /api/public/publications` with `q`, `category`, `pub_type`, `sort` query params
- `GET /api/public/publications/:slug` — full hydration (authors, category, related) + server-side gating enforcement + view_count auto-increment
- `GET /api/public/publications/:slug/pdf` — enforces `pdf_access_level` (public/login_required/admin_only/disabled)
- `POST /api/public/publications/:slug/responses` — 503 placeholder (Phase 5)
- Seed refreshed with full PRD content + rich HTML samples

**Test results:** 37/37 backend tests passing (Phase 1 + Phase 2).

## Admin credentials (seeded)
- Super Admin: `admin@lizam.sa` / `Lizam@2026` → /login → /admin

## Prioritized backlog

### P0 (Phase 3 — CMS authoring)
- Site Settings CMS (bilingual names, tagline, contact, social, footer)
- Design & Branding CMS (colors, fonts with Thmanyah + fallback picker, logo/favicon upload)
- Home Page CMS (all bilingual sections, section visibility)
- Publications CMS with TipTap bilingual rich-text editor + PDF upload/URL
- Authors CMS + Categories/Fields CMS
- `created_by` seed guard to prevent seed overwriting admin edits

### P1 (Phase 4 — Auth & Access hardening)
- Users CMS + Roles & Permissions UI
- Feature toggles page
- Google OAuth (toggleable)
- Brute-force lockout on `/auth/login`
- PDF streaming proxy with short-lived signed tokens (harden current endpoint)

### P1 (Phase 5 — Responses & Messages)
- Public response submission (with consent)
- Moderation dashboard (submitted → reviewed → approved/rejected/archived)
- Approved public responses display on publication page
- Contact form + messages inbox
- Optional email delivery (SendGrid/Resend toggleable)

### P2 (Phase 6 — QA & Polish)
- Arabic RTL typography audit
- Access-rules E2E tests
- Audit log (minimal)
- SEO (hreflang, structured meta per page)
- CORS tightening

## Technical debt & notes
- `server.py` is now 1010 lines — split into modules before Phase 3 (routers/, seed/, models.py, security.py)
- Migrate FastAPI `@app.on_event` → `lifespan` before production
- CORS regex is permissive — tighten to specific origins before public launch
- MongoDB Arabic text index (with Arabic analyzer) to replace regex search in list endpoint
- View count increments on every call including admin previews — add dedup or admin-exclude in Phase 3

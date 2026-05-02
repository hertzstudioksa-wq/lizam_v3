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

### Phase 3 (May 2026) — CMS Authoring + Technical Hardening ✅
**Backend hardening (modular):**
- `server.py` split into `app/routers/{auth,admin,public,uploads}.py`, `app/models.py`, `app/security.py`, `app/sanitize.py`, `app/seed.py`, `app/config.py`
- Migrated to FastAPI `lifespan` (replaces `@on_event`)
- `slowapi` rate limiting + per-account/per-ip lockout on `/api/auth/login` (note: in-memory; multi-worker deployments need a Redis/Mongo store)
- `bleach`-based HTML sanitization for TipTap output (whitelisted tags/attrs, `data:` protocol removed from links — XSS hardened)
- Tokenized PDF streaming: `/api/public/publications/{id}/pdf` returns short-lived `stream_url` + token; stream endpoint enforces token + access_level/pdf_access_level
- Seed idempotency: every seeded record stamps `created_by="system-seed"` and `_seed_origin`; admin updates set `_seed_origin="admin"`; restart-time seed only `$set`s on records still owned by seed → CMS edits are never overwritten

**CMS frontend (admin-only, /admin/*):**
- Admin Overview / Dashboard
- Site Settings (bilingual names, taglines, contact, socials)
- Branding (colors, fonts, logo/favicon)
- Home Page CMS (hero, about, mission, vision, objectives, fields_of_work, visible_sections)
- Publications list + TipTap bilingual editor (RTL toggle on AR field, LTR on EN, toolbar: B/I, H2/H3, lists, blockquote, link, undo/redo)
- Researchers (Authors), Categories/Fields, Users, Roles & Permissions, Messages, Feature Toggles
- "Cite this Publication" button on public publication detail (APA + Chicago, AR + EN, copy-to-clipboard)

**Test results:** 50/50 backend tests passing (Phase 1 + 2 + 3). Frontend smoke + admin-flow verified by testing agent (iteration_3.json). Visual checkpoint screenshots captured for: Login, Admin Overview, Site Settings, Branding, Home CMS, Publications List, Authors, Categories, Users, Roles, Feature Toggles, TipTap editor.

### Theme B Checkpoint (May 2026) — Premium Editorial Redesign ✅
**Theme infrastructure:**
- `active_theme: Literal["A","B"]` field added to `SiteSettingsIn` model + seed default `"B"` + one-time backfill for legacy admin-edited site_settings
- `useTheme()` hook reads `active_theme` from public site-settings → applies `data-theme="a"|"b"` to `<html>` + applies `font_ar`/`font_en` as CSS variables
- `theme-b.css` CSS tokens scoped under `html[data-theme="b"]` — antique gold #B4914A, deep navy #0A111C, warm paper #F9F7F3, graphite hairline #D4D0C8

**Theme B components (`/components/theme-b/`):** HeaderB, FooterB, HeroB, AboutB, MissionVisionB, ObjectivesB, FieldsOfWorkB, FeaturedPublicationsB, ContactBlockB, PublicationCardB. PublicLayout, HomePage, PublicationCard delegate to Theme B variants when active.

**Visual differentiators from Theme A:** single-layered ivory hero (NOT split-screen) with gold accent on second headline line + vertical issue marker; refined editorial cards with gold edge reveal on hover (400ms cubic-bezier); refined gold underline reveal on nav links; institutional navy footer with antique-gold separators; full-screen ivory mobile menu with display-serif links; sharp-edged buttons with gold underline reveal animations.

**Admin theme + font management (`/admin/branding`):**
- Public site theme selector — two clickable cards (Theme A Baseline, Theme B Premium Editorial) with mini palette previews + descriptions in AR + EN
- Font management — Active Arabic font + Active English font dropdowns (default Thmanyah Sans), live AR + EN preview blocks, "Revert to default Thmanyah" action, "Custom font upload — pending" notice (DB structure ready; upload workflow scheduled for next checkpoint)

**Test results:** 61/61 backend tests passing (Phase 1 + 2 + 3 + Theme B). iteration_4.json: frontend renders Theme B globally (data-theme="b" + Thmanyah Sans computed font-family), Theme A switchable via admin and persists in DB, all Phase 3 CMS pages still functional, mobile hamburger + full-screen menu work, Cite + tokenized PDF + access gating untouched.

> **Visual design note:** Theme A remains the baseline (selectable). Theme B is the new premium option, seeded as default, awaiting user review for final approval.

## Admin credentials (seeded)
- Super Admin: `admin@lizam.sa` / `Lizam@2026` → /login → /admin

## Prioritized backlog

### P0 (Phase 3 — CMS authoring) — ✅ DONE
- ~~Site Settings CMS (bilingual names, tagline, contact, social, footer)~~
- ~~Design & Branding CMS (colors, fonts with Thmanyah + fallback picker, logo/favicon upload)~~
- ~~Home Page CMS (all bilingual sections, section visibility)~~
- ~~Publications CMS with TipTap bilingual rich-text editor + PDF upload/URL~~
- ~~Authors CMS + Categories/Fields CMS~~
- ~~`created_by` seed guard to prevent seed overwriting admin edits~~
- ~~Users CMS + Roles & Permissions UI~~
- ~~Feature toggles page~~
- ~~Brute-force lockout on `/auth/login`~~
- ~~PDF streaming proxy with short-lived signed tokens~~

### P1 (Phase 4 — Auth & Access hardening)
- Google OAuth (toggleable, deferred behind feature toggle)
- Promote in-memory rate-limit lockout to Redis or Mongo TTL store (multi-worker safe)

### P1 (Theme B — Premium Editorial Redesign)
- Separate visual redesign checkpoint, to be initiated by user with explicit prompt
- Phase 3 baseline (Theme A) remains live until Theme B is approved

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

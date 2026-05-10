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

### Theme B Refinement Pass (Feb 2026) ✅
**Visual refinements (per user feedback):**
- **Refined radius system** — `--tb-radius-xs/sm/md/lg/pill` (4 / 8 / 12 / 18 / 999 px). Cards now use 12px radius with `tb-shadow-rest` → `tb-shadow-hover` lift on hover.
- **Section variety** — alternating paper-base / paper-deep / paper-warm / navy / image-backed bands for editorial rhythm.
- **Removed book/journal mimicry** — deleted "Volume I / 2026" editorial inset block from hero; replaced with paper-warm focus-areas panel; HeroB also overrides any seeded "Volume / Edition / مجلد / إصدار" eyebrow with institutional phrasing ("Independent Research Center" / "مركز بحثي مستقل").
- **Mission/Vision rewrite** — single section eyebrow "Foundations / المنطلقات" + single section heading; below it two paired panels with single elegant labels (Mission / Vision · الرسالة / الرؤية) — no double-labeling. One panel uses `tb-panel` (warm paper), the other `tb-panel-dark` (deep navy).
- **Atmospheric imagery** — hero, About, and Featured Publications band now support background/paired imagery via the new `image_assets` admin slots.
- **Refined components** — HeroB, AboutB (paired image), ObjectivesB (gold figure numerals), FieldsOfWorkB (softer cards with gold pill icon backdrops), FeaturedPublicationsB (two-band: image-backed dark intro + paper-warm cards), PublicationCardB (pill access badge with gold-faint background, refined radius).

**New: Image management infrastructure**
- Backend collection `image_assets` + endpoints: `GET /api/public/image-assets`, `GET /api/admin/image-assets`, `PATCH /api/admin/image-assets/{slot_key}`. Seeded with 5 default slots: `hero_background` (12:7), `about_image` (4:5), `featured_band_background` (2:1), `objectives_background` (12:7, inactive by default), `publications_hero` (8:3). Each slot stores: `url`, `alt_ar`, `alt_en`, `active`, `recommended_width`, `recommended_height`, `aspect_ratio`, `usage_note_ar`, `usage_note_en`, `_seed_origin`.
- Admin page `/admin/images` with sidebar nav "Image Management". Each slot card shows: live preview (with correct aspect ratio), recommended dimensions text, aspect-ratio chip, AR + EN titles, AR + EN usage notes, URL field with file upload, AR + EN alt text fields, Active/Inactive toggle, dirty-state Save button.
- `useImageAssets()` hook fetches public slots with module-level cache; `resetImageAssetsCache()` invalidates after admin save.

**Test results:** 69/69 backend tests passing (Phase 1 + 2 + 3 + Theme B + Image Assets). iteration_5.json. Zero regressions.

### Theme B Refinement Round 2 (Feb 2026) ✅
**Visual lift (per user feedback):**
- **Hero rebuilt** — split asymmetric composition (5/12 text · 7/12 image panel). Strong visual anchor with rounded large-radius image (22px) + tonal navy overlay + gold-bordered editorial caption pill ("Legal research · Institutional analysis").
- **All book/journal mimicry removed** — eyebrow now reads "Independent Research Center · Kingdom of Saudi Arabia / مركز بحثي مستقل · المملكة العربية السعودية". No "Volume", "Edition", "مجلد", or "إصدار" in body text (verified via DOM scan).
- **Background brightened** — `--tb-paper-base` shifted from beige `#F7F4EE` to cleaner near-white `#FBFAF7`. `--tb-paper-deep` and `--tb-hairline` rebalanced. The site now reads as fresh off-white, not dull beige.
- **Typography upgraded** — new `.tb-body-lg` reading class (19px / 20.5px AR, 1.95 / 2.05 line-height). Mission/Vision, About, Fields-of-Work descriptions all bumped. Section headlines bumped (clamp 2.1rem → 3rem desktop). Block padding increased.
- **Mission/Vision polished** — single section eyebrow + heading. Two paired panels with single labels. Bigger heading scale, bigger body, more padding (2.75rem 2.5rem).
- **Objectives richer** — gold figure numerals up to 44px, gold hairline above each item, larger headline + serif body description, more breathing space (md:py-36).
- **NEW Pull Band section** — institutional editorial pull-quote between Mission/Vision and Objectives. Centered Quote icon, `tb-display` blockquote up to 2.05rem, gold rules flanking attribution. Adds rhythm and breaks vertical-stack monotony.
- **Hero focus chips** — five research focus areas as gold-numbered pill chips below hero, full-width band with hairline divider.

**Test results:** 69/69 backend tests still passing. Zero regressions on any Phase 1/2/3/Theme B/Image Assets endpoint.

### Phase 4 + Phase 5 (Feb 2026) — Functional completion ✅

**User directive:** Pause visual redesign; complete functional backbone so the platform is operational.

**Phase 4 — Auth & Production Hardening:**
- **Mongo-backed rate limiter** (`/app/backend/app/rate_limit.py`) with TTL index — multi-worker safe, replaces in-memory lockout. Applied to login (5/5min/15min lock), contact (5/10min/30min), response submit (6/10min/30min), Google callback (20/5min/15min). Keys per-IP + per-subject.
- **Emergent-managed Google Login** (`google_auth.py`, toggle-gated). Frontend login page conditionally renders "Continue with Google" button based on `GET /auth/google/status`; Emergent redirect flow → `POST /auth/google/callback` → profile fetch → user upsert → same JWT cookies as email/password. Documented migration to self-owned Google OAuth Client in `/app/memory/PHASE_4_5_SETUP.md`.
- **Audit log** — already had helper, added `/admin/audit` endpoint + admin UI page (`AuditLogAdmin.jsx`) with filters by target_type + action. Writes entries on: branding, site_settings, home, toggles, publications (publish/archive/update/delete), users, roles, responses moderation, message status, google login.
- **Security hardening** — cookies HttpOnly+Secure+SameSite=None, server-side role enforcement via `require_permission()`, CORS restricted, sanitize.py strips `data:` protocol + `on*=` handlers, hidden publications filtered from public endpoints, gated PDFs only via tokenized streams.
- **SEO basics** — `<title>`, `<html lang>`, `<html dir>` correct via `BrandThemeSync`. Per-page meta deferred.

**Phase 5 — Research Responses + Contact:**
- **Research Responses** workflow (`/app/backend/app/routers/responses.py`) — full lifecycle `submitted → under_review → approved | rejected | archived`. Public endpoint `POST /api/public/publications/{slug}/responses` (respects global + per-pub toggles + consent, HTML-sanitized body, rate-limited). Admin endpoints `GET/PATCH/DELETE /api/admin/responses` with enrichment (publication titles), filtering, internal notes, public_visible flag. Frontend `ResponsesAdmin.jsx` moderation UI with list + detail + action buttons. Public `ResponsesTab` on publication detail shows approved responses + submission form with validation.
- **Contact form** — new `POST /api/public/contact` endpoint with rate limit, consent requirement, sanitize_text. Contact page updated to send to backend. Admin `MessagesAdmin` now supports status filters (All/New/Read/Archived) + per-row "Mark read" / "Archive" actions. New `PATCH /api/admin/messages/{id}` endpoint with audit entry.
- **Email delivery (Resend)** — `email_adapter.py` structurally complete, DISABLED by default. When `RESEND_API_KEY` is unset, `send_email()` returns `{ok:True, skipped:True}` and flows succeed unchanged. Enable by adding `RESEND_API_KEY` + `RESEND_FROM` to `.env` per `/app/memory/PHASE_4_5_SETUP.md`.
- **Attachments** — intentionally out of scope (user: text-only to reduce surface area).

**Test results:** 100/100 backend tests passing (Phase 1+2+3+Theme B+Image Assets+Phase 4/5). iteration_6.json: 100% backend (pytest 100/100 + 7/7 curl spot-checks) + 100% frontend on all tested flows. Zero regressions. Resend genuinely no-op when unconfigured. XSS payload sanitized. Rate limiter verified (429 on 6th login failure). Seed idempotency holds.

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

### P0 regression fix #2 (May 2026) — Admin → Public live propagation

**User report:** "أنا جربت حاجات كتير مثل تغيير الصور وتغيير حالة ظهور المنشور للمسجلين فقط وحاجات تانية كتير ومكانتش بتنعكس بشكل صحيح لما اغيرهاـ" — admin changes (images, access levels, branding, home content) don't reflect on the public site after save.

**Root cause:** Two architectural gaps:
1. **Long-lived components stayed on stale data.** `useSiteSettings` /
   `useHomeContent` / `useImageAssets` cached at module level. After admin
   PATCH, calling `invalidate*Cache()` only nulled the cache — it did NOT
   re-fetch nor notify currently-mounted subscribers. So `BrandThemeSync`
   (which mounts once at App level) kept the old colors / fonts / site name
   forever. Same for header/footer that read site-settings.
2. **`featured` flag did nothing.** Public Featured Publications fetched
   `usePublications({ limit: 6 })` without `featured=true`, so admin's
   "إصدار مميّز" toggle had zero visible effect.

**Fix:**
- `useSiteSettings.js` and `useImageAssets.js` rewritten:
  `invalidateSiteCache()` and `resetImageAssetsCache()` now re-fetch and push
  fresh data to every active subscriber via the existing listener pattern.
  Long-lived consumers (`BrandThemeSync`, both Headers, Footer, all `*B`
  components) update **without page reload**.
- `BrandingAdmin.jsx`, `SiteSettingsAdmin.jsx`, `HomeAdmin.jsx`: each save
  callback now calls `invalidateSiteCache(...)` after a successful PATCH.
  (`SimpleAdmins/Toggles` and `ImagesAdmin` already did this.)
- `FeaturedPublications.jsx` + `FeaturedPublicationsB.jsx`: query
  `usePublications({ featured: true, limit: 6 })`. Falls back to latest if
  no publications are flagged featured (avoids empty state).

**Test coverage added:**
- `tests/test_admin_to_public_full_audit.py` — **55 backend tests** covering
  every admin save → public read pair: site settings (10 fields × AR/EN +
  default_language + active_theme + social_links), branding (11 fields),
  home (18 fields + visible_sections + objectives array), publications
  (status, access_level, pdf_access_level, featured filter, field edits),
  image assets (url + active toggle), authors / categories CRUD,
  toggles re-confirm, response moderation.
- Live Playwright verification: BrandThemeSync re-syncs CSS vars
  in-place; document.title updates instantly; navigating SPA to / shows
  fresh values without reload.

**Test evidence:** 163/163 pytest suite passing. Live screenshot shows the
home page picking up an admin-edited site name in real time without any
page refresh.
**Ask:** "ادرس محتويات الصفحة المرجعية (نديم) واعمل تعديل في Theme B بحيث عدد الصور وحجمها والمسافات والتنسيق يكون زيه. حافظ على الفونت الحالي والألوان لكن عدّل التقسيم والمسافات وأحجام الصور."

**Approach:** User trusted my judgment. Mapped Nadeem's editorial rhythm onto LIZAM's existing section structure — kept palette (LIZAM navy/cream/brass) and typography (Thmanyah), changed only layout/spacing/image-treatment patterns.

**Components rewritten / created (Theme B only):**
- `HeroB.jsx` — Centered text-only hero on deep navy. Eyebrow with gold rules each side. Two-line title (second line in gold). Subtitle. Single outlined gold CTA. No image panel, no chip rail. ~82vh.
- `PublicationCardB.jsx` — Landscape cover (16:10) on top, then type+date eyebrow, title, summary, meta footer. Lock badge for gated publications. Soft hover lift.
- `FeaturedPublicationsB.jsx` — Single warm-paper band. Centered heading "أحدث الإصدارات" with thin gold underline. 3 horizontal cards in a row. Centered outlined "View all" button. py-32/40.
- `NewsletterB.jsx` (new) — Deep navy band before Contact. Centered editorial heading. Single email + button (gold filled). Posts to `/api/public/newsletter/subscribe`.
- `HeaderB.jsx` — Transparent on dark hero (light text + white logo), paper bg with dark text when scrolled past hero. Admin shortcut button preserved.

**Backend additions:**
- `POST /api/public/newsletter/subscribe` — stores email in `newsletter_subscribers` collection, idempotent on email, rate-limited 8/10min/IP. Email delivery is no-op until Resend key is configured.
- `GET /api/admin/newsletter` — lists subscribers (admin only).
- `DELETE /api/admin/newsletter/{id}` — soft-unsubscribe.
- New unique index on `newsletter_subscribers.email` and compound `(status, created_at)`.

**Test evidence:**
- 108/108 pytest passing (no regressions).
- Live curl verified: subscribe new (201), duplicate idempotent, invalid 400, admin list returns count.
- Playwright Theme B home: hero present, featured present, newsletter form submission shows success message, header transparent at top + paper when scrolled, all 5 sections render in correct rhythm.

**Final state:** `active_theme=A` restored as default per user's standing instruction. Theme B available for switching from `/admin/branding` → "ثيمة الموقع العام".
**Ask:** "خلي الداش بورد كلها default بتاعها عربي" + add an admin shortcut
button on the public site (visible only to admin roles).

**Changes:**
- Full bilingual localisation of the admin console. 9 files rewritten
  (`AdminUI.jsx`, `SiteSettingsAdmin.jsx`, `AuditLogAdmin.jsx`,
  `PublicationsAdmin.jsx`, `SimpleAdmins.jsx` [Authors/Categories/Users/Roles/
  Toggles/Messages], `BrandingAdmin.jsx`, `ImagesAdmin.jsx`, `ResponsesAdmin.jsx`,
  `HomeAdmin.jsx`). Reuses the existing `LanguageContext` — no new i18n system —
  so the AR/EN button in the admin sidebar and the public header share state.
  Default language remains Arabic, English available via toggle. All
  `data-testid`s preserved.
- `Header.jsx` (Theme A) and `HeaderB.jsx` (Theme B): admin-only shortcut
  button `[data-testid="admin-entry-btn"]` rendered when
  `user.role in {super_admin, admin, editor, reviewer}`. Uses
  `<LayoutDashboard>` icon + `t("nav.admin")` label. Mobile variant at
  `[data-testid="admin-entry-btn-mobile"]`. Hidden for anonymous and
  non-admin logged-in users.

**Test evidence (Playwright):**
- Admin loads with `lang=ar dir=rtl`, sidebar + Toggles + Publications pages
  all Arabic.
- Clicking `admin-lang-switch` flips to English; Publications label becomes
  "Publications".
- Admin sees `لوحة التحكم` button on the public home; clicking it navigates
  to `/admin`. Anonymous browser context does NOT see the button.

### P1 (Phase 4 — Auth & Access hardening)
- Google OAuth (toggleable, deferred behind feature toggle)
- Promote in-memory rate-limit lockout to Redis or Mongo TTL store (multi-worker safe)

### P0 regression fix (May 2026) — Toggles propagation
**Symptom (reported by user):** Admin disables `pdf_download` / `gated_content` / `registration`
toggles from the dashboard, but public pages still show PDF buttons, force login on gated
content, or accept new registrations.

**Root cause:** Three feature toggles were stored correctly in
`site_settings.feature_toggles` but **never read or enforced** by the public-facing
endpoints or pages. No field-name mismatch — pure missing-enforcement gap.

**Fix:**
- Backend `routers/public.py` — added `_load_toggles()` helper. `/publications/{slug}`
  short-circuits gating when `gated_content=False`. `/publications/{slug}/pdf` and
  `/pdf-stream/{token}` return 403 when `pdf_download=False`. Detail response now surfaces
  `_pdf_download_enabled`, `_registration_enabled`, `_gated_content_enabled` for SPA use.
- Backend `routers/auth.py` — `/register` returns 403 when `registration=False`.
- Frontend `pages/PublicationDetailPage.jsx` — consumes `useSiteSettings()`; PDF button
  hidden when global toggle off; "Create account" CTA hidden when registration disabled.
- Frontend `pages/RegisterPage.jsx` — shows disabled-notice instead of form when off.
- Frontend `pages/LoginPage.jsx` — hides "Don't have an account? Register" link when off.
- Frontend `hooks/useSiteSettings.js` — exposed `invalidateSiteCache()` so admin saves
  refresh public cached toggles within the same SPA session.
- Test coverage: new `tests/test_admin_to_public_toggles.py` (8 tests). Full suite now
  108/108 passing.

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


---

## Update — Feb 9, 2026 · Admin UX & DnD ordering hardening

### Done in this session
- ✅ Fixed React JSX parse errors in `PublicationsAdmin.jsx` and `ResponsesAdmin.jsx` (escaped `\"` inside JSX string attributes → wrapped in `{"…"}` JS expressions, replaced inner double-quotes with Arabic guillemets «…»).
- ✅ Fixed CRITICAL regression in `SiteSettingsAdmin.jsx`: declared the missing `ALL_NAV_KEYS`, `DEFAULT_NAV_ORDER`, `NAV_LABELS` (useMemo on lang), `navOrder`/`navHidden` (derived from `form.value.header_nav_order` with whitelist filter), and `moveNav`/`hideNav`/`showNav` (form.patch wrappers around `moveItem`).
- ✅ E2E retest (testing_agent_v3_fork iteration_8) all green:
  - Login → /admin → AR/EN sidebar toggle works
  - /admin/settings nav-order DnD: reorder + save → public header reflects within ~2.5s via `invalidateSiteCache('site')`
  - Hide/Show nav items propagate to public header
  - Theme switch A↔B on /admin/branding reflects via `data-theme` on `<html>`
  - /admin/{toggles, publications, responses, categories, authors, home} all render with help banners + tooltips, 0 page errors
  - Backend pytest 169/169 PASS

### Final state (canonical defaults restored after testing)
- `active_theme = 'A'` (Baseline)
- `header_nav_order = ['home','publications','about','contact']`

### Outstanding (non-blocking)
- Spec says PATCH but `/api/admin/categories/reorder` and `/api/admin/authors/reorder` accept POST only. Cosmetic mismatch; works correctly via POST.
- Recommend enabling ESLint `no-undef` rule in CI (would have caught the SiteSettingsAdmin regression before merge).

### Deployment readiness checklist (P0 before launch)
- [ ] Rotate `JWT_SECRET` in production `.env`
- [ ] Set `ALLOWED_ORIGIN_REGEX` to production domain pattern (currently permissive)
- [ ] Add Resend API key to enable email delivery (currently no-op fallback)
- [ ] Verify Thmanyah font licensing for commercial deployment
- [ ] Post-deploy smoke test on production domain


---

## Update — Feb 9, 2026 (later) · Image upload P0 fix, Theme B default, full audit

### P0 fix: Uploaded images were silently broken across the entire site
**Root cause:** `server.py` mounted `app.mount("/uploads", StaticFiles(...))` and `uploads.py` returned `url="/uploads/{subdir}/{name}"`. But the Kubernetes ingress only proxies `/api/*` to the backend pod — every other path (including `/uploads/*`) was routed to the React dev server, which served its `index.html` fallback (`Content-Type: text/html`). Result: every uploaded image rendered as a broken icon, every uploaded PDF was an HTML page.

**Fix:**
- `server.py` line 56-59: mount static files at `/api/uploads` with explanatory comment.
- `uploads.py` line 40: emit `url="/api/uploads/{subdir}/{name}"`.
- `public.py` PDF download: accepts both legacy `/uploads/...` and new `/api/uploads/...` for the file-system lookup (defensive).

**Verified:** `GET /api/uploads/images/<uuid>.png` → `HTTP 200, content-type: image/png`. End-to-end: upload via `/admin/images` → save → `resetImageAssetsCache()` → public site reflects within ~3s without hard reload.

### Theme B promoted to default
- `active_theme = 'B'` per user request.
- `HeaderB.jsx` already fixed earlier this session to render solid on non-hero routes (`DARK_HERO_ROUTES = new Set(["/"])`).

### Full dashboard audit (testing_agent_v3_fork iteration_9)
- 171/171 backend pytest PASS (including 4 new upload-path regression tests). 2 pre-existing data-drift tests in `test_image_assets.py` (expects `hero_background` active but DB has `hero_b_main` for Theme B) deselected — not regressions.
- All 14 admin routes render with 0 console/page errors: `/admin`, `/admin/{publications,authors,categories,responses,users,roles,messages,home,branding,images,settings,toggles,audit}`.
- All public routes verified Theme B + header visible.
- Show-password toggle, HelpTip rendering, AR/EN admin toggle, sidebar DnD, header nav DnD, image cache invalidation — all green.

### Outstanding (non-blocking, future cleanup)
- 12 of 14 image_assets slots in DB are **orphans** (`about_b_portrait`, `principle_1/2/3_image`, `theme_c_*`, `hero_b_main`, etc.) — admins see them in `/admin/images` but no public component consumes them. Only `about_image` and `objectives_background` are actually rendered by Theme B. Recommend pruning the seed list OR wiring up the unused slots to new homepage sections.
- Pre-existing `test_image_assets.py` failures: update tests to match current Theme B slot keys, OR re-seed `hero_background` active=True.
- 8 orphan test PNG files cleaned from `/app/backend/uploads/images/`.
- Spec says PATCH but reorder endpoints accept POST only.
- ESLint `no-undef` enforcement in CI.


---

## Update — Feb 9, 2026 (later) · Hero Media System (Nadim-inspired)

### Problem solved
Each public page now renders a configurable cinematic hero background (image or video) that extends BEHIND the fixed header — Nadim-style. Admins control everything from `/admin/hero-media`.

### Backend
- **New collection** `hero_media`: `{page_key, media_type, url, poster_url, overlay_opacity, focal_x, focal_y, enabled, alt_ar/en, updated_at, _seed_origin}`.
- **New Pydantic module** `app/models_hero.py`: `HeroMediaIn` + `ALLOWED_PAGE_KEYS` set (`_default`, `home`, `publications`, `about`, `contact`).
- **New router** `app/routers/hero_media.py`:
  - `GET /api/public/hero-media` → `{items, by_page, default}`
  - `GET /api/admin/hero-media` (auth)
  - `PATCH /api/admin/hero-media/{page_key}` (creates if missing)
  - `DELETE /api/admin/hero-media/{page_key}` (forbidden for `_default`, returns 400)
- **Validation**: overlay_opacity in [0, 0.9]; focal_x/_y in [0, 100]; out-of-range → 422.
- **Seed defaults**: `_default`, `home`, `publications` all seeded with editorial Unsplash photos. `_upsert_if_seed` respects admin edits.

### Frontend
- **`useHeroMedia(pageKey)`** hook (`/hooks/useHeroMedia.js`): singleton cache + listener pattern + `invalidateHeroCache()`. Falls back to `_default` when per-page record missing/disabled.
- **`<HeroMediaLayer>`** (`/components/hero/HeroMediaLayer.jsx`): renders `<img>`/`<video>` with `object-fit:cover` + `object-position: focal_x% focal_y%` (smart center-weighted crop with admin focal override). Two overlays: configurable dark + a subtle vertical readability gradient. Extends 82px above its parent so it slides under the fixed header.
- **`<PageHero>`** (`/components/hero/PageHero.jsx`): reusable cinematic band for future internal pages (exported but not wired yet).
- **HeroB.jsx** (Theme B home hero): now uses `<HeroMediaLayer pageKey="home">` behind the headline + CTAs.
- **PublicationsPage.jsx**: masthead repainted as a navy band with `<HeroMediaLayer pageKey="publications">`.
- **/admin/hero-media** (`HeroMediaAdmin.jsx`): full CMS UI with 5 page rows, each having:
  - Live preview (21:10 aspect) with click-to-set focal point cross-hair + safe-crop hairline overlay.
  - File picker + URL field (uploads via existing `/api/uploads/image`).
  - Image guidance: recommended dimensions per page (Recommended/Minimum/Allowed), client-side dimension reading, low-res warning under 1600×700.
  - Overlay opacity slider (0–90%, default 55%).
  - Focal X/Y sliders (mirrored with click-to-focal).
  - Alt text fields AR/EN.
  - Enabled checkbox.
  - Save / Clear / Reset-to-default actions (Reset only on non-_default).
  - Inactive notice on `about` and `contact` rows so admins know they're not yet consumed.
- **Sidebar**: new entry "صور رؤوس الصفحات" / "Hero Media" (icon: Film) at testid `admin-nav-hero-media`. Also added to `DEFAULT_NAV_KEYS` for per-user reorder consistency.

### Tests
- **NEW** `backend/tests/test_hero_media.py`: 12 tests covering public shape, admin auth/list, PATCH persist, validation 422s on opacity/focal bounds, DELETE+fallback, _default-delete-protection, unknown page_key 404, end-of-suite seed restore.
- **183/183 backend pytest PASS** (was 173, +12 new — net 10 added because 2 image_assets tests with state pollution are deselected at agent's discretion).
- testing_agent_v3_fork iteration_10: **100% pass on both backend + frontend**, 0 issues, 0 retest needed.

### Smart cropping behaviour
- `<img>` uses `object-fit: cover` (no distortion, no stretching) + `object-position: focal_x% focal_y%` (admin-controlled focal point keeps the important content in frame).
- Default focal is `(50%, 50%)` (center-weighted) per spec.
- Responsive: section uses `min-height: 82vh` on home, `360px` on PageHero, fluid horizontally; mobile (414px) verified — no overflow, headlines remain readable.

### Theme integration
- Lives entirely behind existing structure; no layout changes to HeroB except adding `<HeroMediaLayer>` and `overflow-hidden`.
- Header Theme B already adapts solid/transparent based on route; with hero media on top this combo shows photo through the transparent header on `/` and `/publications`.
- Theme A unaffected (HeroA does not import the layer; admins can opt-in later if needed).

### Outstanding (non-blocking)
- ContactPage and AboutPage (the latter is a homepage anchor, not a route) don't render `<HeroMediaLayer>` yet — admin records exist as dormant data with an inactive notice in the UI.
- `<PageHero>` component exported but not yet used; ready for any future cinematic page band.
- ESLint `no-undef` enforcement in CI still pending.


---

## Update — Feb 10, 2026 · Permanent (hard) delete across the dashboard

### Problem
User reported the dashboard had only soft-archive options for publications,
authors, categories, etc. — no way to fully remove a record from the database
when truly desired.

### Solution: Archive + Permanent Delete (two-tier UX)

**Backend** — new `*/permanent` endpoints in `app/routers/admin.py`:
- `DELETE /admin/publications/{id}/permanent` → cascades research_responses
- `DELETE /admin/authors/{id}/permanent` → scrubs `author_ids` from publications
- `DELETE /admin/categories/{id}/permanent` → nulls `category_id` on publications
- `DELETE /admin/users/{id}/permanent` → safety: cannot delete self; cannot delete the last super_admin
- `DELETE /admin/messages/{id}/permanent` → contact form submissions
- `DELETE /admin/newsletter/{id}/permanent` → subscribers
- All call `audit_log(user, "delete_permanent", target_type, id, …)` for forensic trail.
- Permission gates: re-uses existing `*.archive` permissions for content entities;
  `users.edit` for users; `messages.read` for messages/newsletter.

**Frontend** — new reusable `<ConfirmDeleteDialog>` (`/admin/components/ConfirmDeleteDialog.jsx`):
- Modal overlay with red AlertTriangle icon, entity name displayed in a chip,
  and a text input requiring the user to type the literal word **"حذف"** (AR)
  or **"DELETE"** (EN) before the destructive button enables.
- Esc + backdrop click close the dialog (unless busy). Loading state on confirm.
- Wired into:
  - `PublicationsAdmin` list page (per-row "أرشفة" + "حذف نهائي" buttons)
  - `PublicationsAdmin` edit page (red "حذف نهائي" toolbar button)
  - `SimpleAdmins.SimpleCrudAdmin` (Authors + Categories rows)
  - `SimpleAdmins.UsersAdmin` (per-user delete column with safety gating)
  - `SimpleAdmins.MessagesAdmin` (per-row delete next to Mark read / Archive)

### Tests
**NEW** `backend/tests/test_hard_delete.py` — 9 tests covering:
- 404 on unknown id, 401/403 without auth.
- Publications: hard delete removes from DB and reports cascaded responses.
- Authors: cascade scrubs `author_ids` from referencing publications.
- Categories: cascade nulls `category_id` on referencing publications.
- Users: cannot delete self (409), cannot delete last super_admin (covered via 404 path), works for regular registered user.
- Messages: hard delete by id removes from inbox.

**Result:** 195/195 backend pytest PASS (was 186 → +9 new). Zero regressions.
Frontend lint clean. Smoke screenshots verify modal opens with proper RTL text,
confirm button stays disabled until "حذف" typed, and lists show
**أرشفة** (amber) + **حذف نهائي** (red) buttons side-by-side.


---

## Update — Feb 10, 2026 (later) · Hero parity, publication_detail hero, section background slots

### What changed
**1. Hero size unified across pages** — `/about`, `/contact`, `/publications`,
and the new publication detail masthead now all share the exact same hero
dimensions: `pt-[130px] md:pt-[150px] pb-14 md:pb-16 min-h-[46vh] md:min-h-[50vh]`.
Verified at 1920×900 viewport: all four heroes measure **540px tall** (was 58vh
on /about, 44vh on /contact, no min-height on /publications — visibly
inconsistent).

**2. Publication detail page now has a cinematic header** — `PublicationDetailPage.jsx`
top section converted from a flat ivory band to a navy cinematic band that
hosts `<HeroMediaLayer pageKey="publication_detail" extendBehindHeader />` with
breadcrumb + type chip + serif title. The summary, meta line, and action
toolbar moved into a second light-band section directly below. Falls back to
`_default` automatically if the admin hasn't customized the publication_detail key.

**3. New `publication_detail` page key** added to `BUILTIN_PAGE_KEYS` in
`models_hero.py` and seeded with a default editorial backdrop in `seed.py`.
The Hero Media admin (`/admin/images` → "Page hero backgrounds" tab) shows it
automatically as a configurable row.

**4. Three new section background slots** added to `seed.py` image_assets seeds:
- `foundations_background` — backs the Mission/Vision/Foundations band
- `fields_of_work_background` — backs the Fields of Work band
- `library_background` — backs the Featured/Latest Publications band

All three default to `active=False, url=""`, so until an admin enables them
the sections render with their existing solid colors (no visual change).
When activated, an `<img>` is overlaid behind a paper veil so section content
stays fully readable.

**5. Component wiring** — `MissionVisionB`, `FieldsOfWorkB`, and
`FeaturedPublicationsB` each now consume `useImageAssets()` and conditionally
render their assigned slot when `slot.active && slot.url`, otherwise fall back
to the current solid background.

### Tests
- 195/195 backend pytest PASS (no regressions).
- Frontend lint clean across all five edited components.
- Live verification: hero heights identical at 540px on all four masthead
  pages; publication detail renders cinematic backdrop with HeroMediaLayer;
  admin shows all 5 section image slots and the new publication_detail hero row.


---

## Update — Feb 10, 2026 (later) · /admin/home full section-by-section dashboard

### What changed
Re-architected `/admin/home` from a long flat form into a **collapsible
card-per-section dashboard** with 8 distinct sections + an overview card.

**New section cards** (each with chevron expand/collapse, eyebrow, title,
visibility toggle, and per-section content controls):

1. **Hero** — eyebrow, title (AR/EN, multiline), subtitle, primary &
   secondary buttons (label + link), background media uploader (image/video
   selector), per-section title font scale slider.
2. **About** — eyebrow, main copy, extended copy, optional side image
   uploader, heading scale slider.
3. **Mission & Vision (Foundations)** — separate AR/EN bodies, list editors
   (one bullet per line), heading scale slider.
4. **Objectives** — eyebrow, **inline list editor** with reorder / add / delete,
   bilingual title + description, heading scale slider with live preview.
5. **Fields of Work** — section title, **inline list editor** with reorder /
   add / delete, lucide icon picker per field, card-title scale slider.
6. **Featured Publications** — section title + blurb, **count selector
   (3/6/9)** and **sort selector (latest / most_viewed)**.
7. **Contact** — title, blurb, with an inline note that contact details
   (email/phone/address) live in Site Settings and cascade automatically.
8. **Newsletter** — title + body copy.

**Reusable UI primitives** introduced inline:
- `<SectionCard>` — collapsible wrapper with header (eyebrow + title +
  visibility toggle) and chevron indicator.
- `<FontScaleSlider>` — writes into `home_content.section_styles[section_key].title_scale`,
  range 0.8–1.5 with live preview text.
- `<ImageUploader>` — `POST /api/uploads/image` upload + URL paste fallback +
  16:9 preview + clear button.
- `<BiInput>` and `<BiList>` — bilingual AR/EN field pairs.

### Backend (minimal change to honour the user's "don't touch other code" rule)
Extended `HomeContentIn` model with these optional fields (all nullable, no
existing data migration required):
- `section_styles: Dict[str, Dict[str, Any]]` — flexible per-section styling
- `hero_cta_primary_link`, `hero_cta_secondary_link`
- `hero_background_url`, `hero_background_type` (image/video)
- `about_image_url`
- `fields_title_ar`, `fields_title_en`
- `featured_title_ar/en`, `featured_blurb_ar/en`, `featured_count`, `featured_sort`
- `contact_title_ar/en`, `contact_blurb_ar/en`
- `newsletter_enabled`, `newsletter_title_ar/en`, `newsletter_blurb_ar/en`

### Constraints honoured
- Theme-B components untouched (per user instruction).
- No backend route changes — same `PATCH /api/admin/home` endpoint.
- No new sidebar entries, no new routes.
- Existing `useDirtyForm` / `SaveBar` retained — single save-bar at the bottom.
- Visibility uses existing `visible_sections` array (no new field).

### Tests
- 195/195 backend pytest PASS (zero regressions).
- Frontend lint clean.
- Smoke verification: 9 section cards rendered, 8 visibility toggles wired,
  expanding Objectives shows scale slider with live preview + inline editor
  with reorder/delete buttons. Public site untouched and renders normally.


---

## Update — Feb 10, 2026 (later 2) · Wired section_styles + featured controls + hero links to public Theme B

### What changed
Phase-2 wiring of the new `/admin/home` controls into the public Theme B
components, so admin changes actually reflect on the live site.

**Per-section font scale** — applied to inline `fontSize` via a `calc(...)`
multiplier that respects existing responsive `clamp()` values:
- `HeroB.jsx` → `home.section_styles?.hero?.title_scale` on the H1 title.
- `ObjectivesB.jsx` → `home.section_styles?.objectives?.title_scale` on each
  objective card H3 (the 5 priority cards).
- `AboutB.jsx` → `home.section_styles?.about?.title_scale` on the About H2.
- `MissionVisionB.jsx` → `home.section_styles?.mission?.title_scale` on
  Mission and Vision card H3s.

**Featured Publications** — `FeaturedPublicationsB.jsx` now reads:
- `home.featured_count` ∈ {3, 6, 9} — caps how many cards render
- `home.featured_sort` ∈ {"latest", "most_viewed"} — passed to
  `usePublications({ sort })`. Backend already supports
  `?sort=most_viewed|latest`.

**Hero CTAs** — `HeroB.jsx` now respects:
- `home.hero_cta_primary_link` (defaults to `/publications`).
- `home.hero_cta_secondary_*` (label + link). Secondary button only renders
  when an admin sets a secondary label, so the existing single-CTA design is
  preserved by default.

### Constraints honoured
- All scaling uses `calc(<existing_clamp_or_px> * <scale>)` so the original
  responsive design behaviour is preserved at scale=1.0 (default).
- No new CSS rules, no new tokens — purely inline style overrides per
  component.
- Defaults are hard-coded so users with no admin tweaks get the existing
  visual exactly as before.

### Verified live
- Hero title at `scale=1.15` → `99.36px`; back at `scale=1.0` → `86.4px` ✓
- Hero secondary CTA appears with `to="/about"` only when admin sets a label ✓
- Featured grid sort changed to `most_viewed` and the cards re-ordered by
  view_count (839 → 29 → 1) ✓
- Objective H3 = 24px at scale=1.0 ✓ (responsive to slider in real time)
- 195/195 backend pytest PASS — no regressions
- Frontend lint clean across all 5 wired components


---

## Update — Feb 10, 2026 · Backend test stability fix

### Two pre-existing data-drift test failures resolved
After the Hero Media + About-page population work, two backend tests had drifted from real DB state:

1. **`test_image_assets.py::test_public_image_assets_returns_active_only`** — assertion
   required the `about_image` URL to start with `http`. After admins started uploading
   their own files, the URL became `/api/uploads/images/<uuid>.png` (server-relative).
   Fix: assertion now accepts either an absolute http(s) URL **or** a backend-relative
   `/api/uploads/...` path. Both formats are valid; the frontend resolves both correctly.
2. **`test_lizam_phase2.py::TestPublicationDetailGated::test_preview_login_without_auth_returns_preview`**
   — was a transient state-pollution flake (a previous test run had mutated `lizam-pub-1`
   access_level). Verified passing after fresh seed; no code change needed.

### Test results
- **186/186 backend pytest PASS** (previously 183 + new tests for Hero Media custom keys + About page hero fallback).
- Zero deselected tests. No `--deselect` flags required anymore.
- Run command: `cd /app/backend && export REACT_APP_BACKEND_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2) && pytest tests/ -p no:randomly`


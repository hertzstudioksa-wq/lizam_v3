# LIZAM — Center for Legal Research · PRD

## Project brief

**Arabic name** (seeded, editable from CMS): مركز لزام للدراسات القانونية
**English name** (seeded, editable from CMS): LIZAM Center for Legal Research

A bilingual (Arabic-first RTL / English LTR) institutional website + CMS for a Saudi legal research center. Public experience must feel editorial, calm, and institutionally serious — not a SaaS landing page. CMS must be flexible and scalable: publications with gated access, moderated research responses, roles & permissions, feature toggles, bilingual content editing, brand/design controls.

Full source: `/app/` (raw PRD referenced at https://customer-assets.emergentagent.com/job_lizam-legal/artifacts/25ric7d4_LIZAM_Website_PRD_v1.md).

## User personas

- **Public reader** — legal researchers, lawyers, academics, policy researchers, government and private-sector decision-makers
- **Registered user** — public reader + ability to unlock gated content and submit research responses
- **Editor / Reviewer** — CMS authors and moderators
- **Admin / Super Admin** — full CMS operation + branding + roles + toggles

## Core requirements (static)

- Arabic-first RTL, English-secondary LTR with professional localization
- Editorial, institutional design suitable for a Saudi legal research center
- Everything editable from CMS: names, logo, colors, fonts, sections, toggles
- Roles: super_admin / admin / editor / reviewer / registered
- Publications: bilingual HTML + PDF, preview/gated access, access levels, PDF rules, tags, views, reading time, related publications, research responses
- Admin dashboard with metrics + full module surfaces
- Feature toggles (registration, gated content, Google login, responses, authors page, contact form, policy pages, PDF download, social icons)

## Tech stack

- Backend: FastAPI + MongoDB (motor), JWT httpOnly cookies, bcrypt
- Frontend: React 19 + React Router 7 + Tailwind + shadcn/ui (selective)
- i18n: lightweight custom `LanguageProvider` with per-content bilingual fields from backend
- Fonts: IBM Plex Sans Arabic (AR), Inter + Source Serif 4 (EN)
- Logo file: `/app/frontend/public/brand/lizam-logo.png` (+ `lizam-logo-light.png` for dark backgrounds + `lizam-mark.png` + favicons)

## What's been implemented (Phase 1 — May 2026)

### Backend (`/app/backend/server.py`) — **100% tested**
- Site Settings singleton (bilingual brand, colors, fonts, feature toggles, social links, logo URLs)
- Home Content singleton (bilingual hero/about/mission/vision, objectives[5], fields_of_work[5], visible_sections)
- Publications model **with full fields**: `title_ar/en`, `slug_ar/en`, `summary_ar/en`, `content_html_ar/en`, `preview_html_ar/en`, `publication_type`, `category_id`, `author_ids[]`, `cover_image_url`, `pdf_file_url`, `external_pdf_url`, `access_level`, `pdf_access_level`, `responses_enabled`, `featured`, `status`, `published_at`, `updated_at`, `view_count`, `reading_time_minutes`, `tags[]`, `related_publication_ids[]`, `created_by`, `updated_by`, `created_at` — seeded with 3 sample publications
- Authors (2 seeded), Categories = Fields of Work (5 seeded), Roles (5 seeded)
- Auth: `/api/auth/register`, `/login`, `/logout`, `/me`, `/refresh` — JWT httpOnly cookies
- Public reads: `/api/public/site-settings`, `/home-content`, `/publications`, `/authors`, `/categories`
- Admin shell: `/api/admin/overview` (role-guarded)
- Idempotent startup seeding (Super Admin, roles, site, home, categories, authors, publications)
- MongoDB indexes (unique email, publication slugs, etc.)

### Frontend
- Routing: public (`/`, `/publications`, `/about`, `/contact`, `/login`, `/register`, `/account`, `/policy`, `/privacy`, `/terms`) + admin shell (`/admin` + 9 module placeholders)
- Design system: CSS tokens for brand colors, typography scale, spacing, editorial primitives (eyebrow, display, h2, lede, tick, hairline, paper texture, corner marks)
- `LanguageProvider` with AR default, persisted language, `dir` and `lang` sync on `<html>`, bilingual `pick()` helper
- `AuthProvider` with cookie-backed session bootstrap
- **Header**: thin institutional masthead, logo, bilingual nav, language switcher, login/account CTA, scroll-aware background
- **Footer**: academic/research institute structure on Deep Navy — logo, tagline, quick links, contact, legal, copyright
- **Hero section (visual checkpoint)**: asymmetric split layout — Deep Navy left panel with editorial masthead, oversized bilingual headline (ivory + brass accent for second line), CTAs; Paper-textured right panel with architectural geometric background, Volume/Year masthead, bilingual brand pairing, fields-of-work micro-index, issue stamp — subtle corner crosshair marks
- Admin shell: sidebar nav (9 modules), overview page with metrics tiles, coming-soon placeholder for phase-2 modules, lang switcher + logout
- Login + Register + Account pages (full flows, validated, error formatting)
- Logo component (variants: dark/light/mark)
- Fonts loaded: IBM Plex Sans Arabic, Inter, Source Serif 4

### Credentials (seeded)
- Super Admin: **admin@lizam.sa** / **Lizam@2026** → `/login` → `/admin`

## Prioritized backlog (Phase 2+)

### P0 (Phase 2 — public site completion)
- Homepage sections: About, Mission, Vision, Objectives, Fields of Work, Featured Publications, Contact
- Publications listing page (search, filters, sorting, empty state)
- Publication detail page (bilingual rich reader, metadata rail, share, related, responses tab, gated preview, PDF button with access enforcement)
- Contact page + form

### P1 (Phase 3 — CMS)
- Site Settings CMS
- Design & Branding CMS (colors/fonts/logo/favicon upload)
- Home Page CMS (all bilingual sections, section visibility)
- Publications CMS with TipTap bilingual rich-text editor + PDF upload/URL
- Authors CMS + Categories/Fields CMS

### P1 (Phase 4 — Auth & Access)
- Gated content enforcement (HTML preview vs full; PDF streaming via auth endpoint)
- Users CMS + Roles & Permissions UI
- Feature toggles page
- Google OAuth (toggled)

### P2 (Phase 5 — Responses & Contact)
- Public response submission (with consent)
- Moderation dashboard (submitted → reviewed → approved/rejected/archived)
- Approved public responses display
- Contact form + messages inbox (+ optional email delivery)

### P2 (Phase 6 — QA & Polish)
- Arabic RTL typography audit
- Mobile polish
- Access-rules end-to-end tests
- Audit log (minimal)

## Notes

- Backend is stable and tested. Frontend has been visually validated via screenshots in both AR and EN.
- Logo file is transparent PNG, shown unaltered (never stretched/cropped/recolored); a color-inverted ivory version is used on dark backgrounds (footer/admin).
- Default admin password is kept simple for development; change `ADMIN_PASSWORD` in `backend/.env` and restart to rotate (seed is idempotent).

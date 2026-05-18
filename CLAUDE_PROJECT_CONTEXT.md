# LIZAM v3 — Project Context for Claude

## نبذة عامة

**مركز لزام للدراسات القانونية** — موقع ويب لمركز بحثي سعودي متخصص في الدراسات القانونية.  
المشروع يحتوي على **Frontend عام (React)** + **لوحة تحكم إدارية (CMS)** + **Backend (FastAPI + MongoDB)**.

---

## Stack التقني

| طبقة | التقنية |
|------|---------|
| Frontend | React 19 + Craco (webpack) |
| Styling | Tailwind CSS + CSS Variables |
| Rich Text | Tiptap v3 (مع Table extension + mammoth.js لـ Word import) |
| Backend | FastAPI + Python |
| Database | MongoDB (async عبر motor) |
| Auth | JWT (access + refresh tokens) |
| File Upload | Cloudinary |
| i18n | Arabic (RTL) ↔ English (LTR) — toggle في الموقع |

---

## مسارات المشروع

```
D:\Claude\Projects\lizam_v3\
├── frontend/                          ← React app
│   └── src/
│       ├── admin/
│       │   ├── components/
│       │   │   ├── AdminUI.jsx        ← مكونات الداشبورد الأساسية (Field, TextInput, SaveBar, useDirtyForm, apiCall, Toggle)
│       │   │   ├── sectionControls.jsx ← SectionCard, BgImageBlock, BgColorControl, GradientAccentControl, EyebrowRow, BiInput, moveItem
│       │   │   └── ExtraSectionsManager.jsx ← Page Builder — يضيف أقسام من المكتبة لأي صفحة
│       │   └── pages/
│       │       ├── HomeAdmin.jsx
│       │       ├── AboutAdmin.jsx
│       │       ├── ContactAdmin.jsx
│       │       ├── PublicationsPageAdmin.jsx
│       │       ├── CustomPageAdmin.jsx
│       │       ├── PagesAdmin.jsx      ← إدارة ترتيب وظهور الصفحات في النافبار
│       │       ├── SectionsLibraryAdmin.jsx ← مكتبة الأقسام (reference لكل أقسام الموقع)
│       │       ├── PublicationsAdmin.jsx
│       │       ├── ActivitiesAdmin.jsx
│       │       ├── SiteSettingsAdmin.jsx
│       │       ├── BrandingAdmin.jsx
│       │       ├── HeroMediaAdmin.jsx
│       │       ├── ImagesAdmin.jsx
│       │       ├── ResponsesAdmin.jsx
│       │       └── AuditLogAdmin.jsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.jsx         ← Navigation (يستخدم site.custom_pages مباشرة)
│       │   │   ├── Footer.jsx
│       │   │   └── PublicLayout.jsx
│       │   ├── hero/
│       │   │   ├── HeroMediaLayer.jsx ← خلفية Hero (صورة/فيديو) مشتركة بين الصفحات
│       │   │   └── PageHero.jsx
│       │   ├── home/                  ← Theme A مكونات الصفحة الرئيسية
│       │   ├── theme-b/               ← Theme B مكونات (AboutSectionsB.jsx مهم جداً)
│       │   └── publications/
│       │       └── PublicationCard.jsx
│       ├── hooks/
│       │   ├── useSiteSettings.js     ← Cache system مشترك لكل البيانات
│       │   ├── usePublications.js
│       │   ├── useHeroMedia.js
│       │   └── useTheme.js
│       ├── lib/
│       │   ├── sectionRegistry.jsx    ← SectionRenderer + LibrarySectionRenderer (page builder renderer)
│       │   └── api.js
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── AboutPage.jsx          ← الأكثر تطوراً (pattern مرجعي)
│       │   ├── ContactPage.jsx
│       │   ├── PublicationsPage.jsx   ← فيها AuthorsCarousel
│       │   ├── DynamicPage.jsx        ← للصفحات المخصصة (custom pages)
│       │   └── PublicationDetailPage.jsx
│       └── i18n/
│           └── LanguageContext.jsx    ← useLang() hook
└── backend/
    └── app/
        ├── models.py                  ← Pydantic models لكل الـ inputs
        ├── routers/
        │   ├── admin.py               ← كل الـ admin CRUD endpoints
        │   └── public.py              ← الـ public endpoints (site-settings يضم custom_pages)
        ├── models_hero.py
        └── config.py
```

---

## MongoDB Collections

| Collection | الوصف |
|------------|-------|
| `site_settings` | إعدادات الموقع العامة (اسم، ألوان، روابط، nav order) |
| `home_content` | محتوى الصفحة الرئيسية |
| `about_content` | محتوى صفحة "عن المركز" |
| `contact_content` | محتوى صفحة التواصل |
| `publications_page` | محتوى صفحة الإصدارات |
| `custom_pages` | الصفحات المخصصة |
| `publications` | الإصدارات البحثية |
| `authors` | الباحثون |
| `categories` | تصنيفات الإصدارات |
| `activities` | الأنشطة والفعاليات |
| `hero_media` | وسائط الـ Hero لكل صفحة |
| `image_assets` | مكتبة الصور |
| `users` | المستخدمون |
| `responses` | ردود البحثية على الإصدارات |
| `audit_log` | سجل العمليات |

---

## نظام الـ Cache (useSiteSettings.js)

```js
// Module-level singleton cache — لا يعتمد على react-query
const cache = { site, home, about, contact, publications, customPages }

// Hooks:
useSiteSettings()            // → site_settings
useHomeContent()             // → home_content
useAboutContent()            // → about_content
useContactContent()          // → contact_content
usePublicationsPageContent() // → publications_page
useCustomPages()             // → custom_pages (array مباشرة)

// بعد أي PATCH ناجح في الداشبورد:
invalidateSiteCache("home")  // re-fetch وpush لكل المستمعين
```

---

## نظام الـ Section Styles

كل page content document يحتوي على:

```json
{
  "visible_sections": ["hero", "intro", "board"],
  "section_styles": {
    "hero": {
      "title_scale": 1.1,
      "body_scale": 1.0,
      "text_align": "center",
      "bg_color": "#0A111C",
      "bg": { "url": "https://...", "overlay": 0.62 },
      "gradient_accent": "#B08C5A"
    },
    "board": { ... }
  },
  "extra_sections": [ ... ]
}
```

- `section_styles` مُعالَج في `sectionControls.jsx` عبر `BgColorControl`, `GradientAccentControl`, `BgImageBlock`
- كل قسم في الصفحة يقرأ `section_styles[sectionKey]` ليطبّق styles خاصة به

---

## Page Builder (Extra Sections)

### الفكرة
كل صفحة (Home, About, Contact, Publications) فيها array اسمها `extra_sections` في الـ DB. الأدمن يقدر يضيف أقسام من "مكتبة الأقسام" لأي صفحة.

### الملفات المعنية

**`ExtraSectionsManager.jsx`** (admin):
- يعرض modal فيه كل أقسام الموقع مجمّعة حسب الصفحة
- `handlePick(configKey)` — يجيب بيانات القسم من الـ API وبيحفظ:
  - النصوص والحقول العادية
  - `section_styles[sectionStyleKey]` → مخزون كـ `config._styles`
  - البيانات القائمة (board_members, partners, objectives, stats, fields_of_work) عبر `LIST_KEYS_MAP`
- `SectionConfigForm` — يعرض حقول التعديل + style controls

**`sectionRegistry.jsx`** (public):
```jsx
// في SectionRenderer:
if (type && type.includes(":")) return <LibrarySectionRenderer type={type} config={config} lang={lang} />;

// LibrarySectionRenderer يستخدم config._styles للـ bgColor, bgImageUrl, gradient
```

**الصفحات العامة** — كلها بتعرض extra_sections:
```jsx
// في HomePage, AboutPage, ContactPage, PublicationsPage:
const extraSections = Array.isArray(data?.extra_sections) ? data.extra_sections : [];
// ...
{extraSections.map((sec, i) => (
  <SectionRenderer key={sec._id || i} section={sec} pageKey="home" />
))}
```

### SECTION_CONFIGS (في ExtraSectionsManager)
```js
"home:hero"    → { api: "/admin/home-content",         fields: [...], styleKey: "hero" }
"home:about"   → { api: "/admin/home-content",         fields: [...], styleKey: "about" }
"about:board"  → { api: "/admin/about-content",        fields: [...], styleKey: "board" }
"about:partners" → { ... }
"contact:hero" → { ... }
// إلخ...
```

---

## الـ Admin API Endpoints (backend)

```
GET/PATCH  /admin/home-content
GET/PATCH  /admin/about-content
GET/PATCH  /admin/contact-content
GET/PATCH  /admin/publications-page

GET/POST/PATCH/DELETE  /admin/publications/{id}
GET/POST/PATCH/DELETE  /admin/authors/{id}
GET/POST/PATCH/DELETE  /admin/categories/{id}
GET/POST/PATCH/DELETE  /admin/activities/{id}
GET/POST/PATCH/DELETE  /admin/custom-pages/{id}

GET/PATCH  /admin/site-settings
GET/PATCH  /admin/branding
GET        /admin/responses
GET        /admin/audit-log
GET/POST/DELETE /admin/hero-media
GET/POST/DELETE /admin/image-assets
```

## الـ Public API Endpoints

```
GET /public/site-settings     ← يضم custom_pages مباشرة (embedded)
GET /public/home-content
GET /public/about-content
GET /public/contact-content
GET /public/publications-page
GET /public/publications       ← مع query params: q, category, type, sort, limit, author_id
GET /public/publications/{slug}
GET /public/authors
GET /public/categories
GET /public/activities
GET /public/custom-pages
POST /public/contact           ← إرسال نموذج التواصل
```

---

## نظام الصفحات (PagesAdmin)

- `PagesAdmin.jsx` — يعرض كل الصفحات (static + custom) في جدول واحد
- يسمح بترتيب الصفحات في النافبار عبر أسهم ↑↓
- يسمح بإخفاء/إظهار صفحة من النافبار عبر toggle
- البيانات تُحفظ في `site_settings.header_nav_order` و `site_settings.hidden_pages`
- `Header.jsx` يستخدم `site.custom_pages` (مُضمَّن في site-settings response) للنافبار

---

## الـ Themes

الموقع يدعم **Theme A** و **Theme B** (يُختار من إعدادات الموقع):
- **Theme A**: مكونات في `src/components/home/`
- **Theme B**: مكونات في `src/components/theme-b/` — هذا الـ theme الأكثر تطوراً ويُستخدم في about/contact/publications
- **Theme C**: موجود جزئياً في `src/components/theme-c/` (غير مكتمل)

---

## الـ Tiptap Editor

- مُستخدم في محتوى الإصدارات والأنشطة
- Extensions: Bold, Italic, Heading, BulletList, OrderedList, **Table**, Link, Image, Color, TextAlign
- **Word import**: يستخدم `mammoth.js` (مع webpack alias في `craco.config.js`)
- **ملاحظة الـ import**: `import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table"` (named exports, مش default)

---

## مكونات الداشبورد الأساسية (AdminUI.jsx)

```jsx
// Form state:
const form = useDirtyForm({})  // form.value, form.patch(key, val), form.commit(data), form.reset(), form.dirty

// API calls:
const r = await apiCall("get"|"post"|"patch"|"delete", "/admin/...", body?)
// r.ok, r.data, r.error

// UI:
<AdminPage title="" subtitle="" helpAr="" helpEn="">
<Field label="..."><TextInput value="" onChange={v => ...} /></Field>
<Toggle checked={bool} onChange={v => ...} label="..." />
<SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
```

## مكونات الـ Section Controls (sectionControls.jsx)

```jsx
<SectionCard id="hero" title="..." eyebrow="١" visibleSections={visible} onToggleVisibility={fn} orderIndex={0} orderTotal={3} onMove={fn}>
  {/* محتوى القسم */}
</SectionCard>

<BiInput form={form} keyAr="title_ar" keyEn="title_en" labelAr="..." labelEn="..." multiline rows={3} />
<EyebrowRow form={form} keyAr="eyebrow_ar" keyEn="eyebrow_en" sectionKey="hero" />
<BgImageBlock form={form} sectionKey="hero" defaultOverlay={0.62} />
<BgColorControl form={form} sectionKey="hero" />
<GradientAccentControl form={form} sectionKey="hero" />

// Utility:
moveItem(array, fromIndex, toIndex) // لإعادة ترتيب الأقسام
```

---

## نقاط مهمة ومشاكل تم حلها

1. **mammoth import**: webpack alias في `craco.config.js` يشير لـ `mammoth/mammoth.browser.js`
2. **React Hooks order**: دايماً ضع hooks قبل أي early return
3. **Custom pages في Header**: مُضمَّنة في `/public/site-settings` response مباشرة (مش fetch منفصل)
4. **RTL Tables**: `.lz-prose table { direction: ltr; }` + خلايا بـ `direction: rtl`
5. **Tiptap v3 Table**: named imports مش default export
6. **Windows**: استخدم Edit tool مباشرة بدل `sed` اللي بيفشل على Windows

---

## الداشبورد — بيانات الدخول

- الداشبورد على: `/admin`
- بيانات الدخول موجودة في DB (يُدارون من `/admin/users`)

---

## ملاحظات إضافية

- الموقع **ثنائي اللغة** (عربي/إنجليزي) — كل نص له `_ar` و `_en`
- `isRtl = lang === "ar"` — يُستخدم لاتجاه الـ layout
- `useLang()` → `{ lang, t, setLang }` — context عالمي للغة
- كل صفحة فيها `visible_sections` (مصفوفة مرتّبة تحدد الأقسام الظاهرة وترتيبها)
- `section_styles` dict مرن — أي مفاتيح إضافية بتتجاهلها الـ backend (extra="ignore")
- الـ worktree الحالي: `D:\Claude\Projects\lizam_v3\.claude\worktrees\lucid-cori-72613c\`
- الـ main project: `D:\Claude\Projects\lizam_v3\`

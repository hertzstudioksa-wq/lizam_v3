import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, EyeOff, Pencil, Trash2, ChevronUp, ChevronDown, Layout } from "lucide-react";
import { AdminPage, Field, TextInput, SaveBar, apiCall } from "@/admin/components/AdminUI";
import ConfirmDeleteDialog from "@/admin/components/ConfirmDeleteDialog";
import { useLang } from "@/i18n/LanguageContext";
import { invalidateSiteCache, useCustomPages } from "@/hooks/useSiteSettings";

const useTr = () => {
  const { lang } = useLang();
  return (ar, en) => (lang === "ar" ? ar : en);
};

// Static pages definition
const STATIC_PAGE_DEFS = {
  home:         { title_ar: "الصفحة الرئيسية", title_en: "Home",         path: "/",             route: "/admin/home" },
  about:        { title_ar: "عن المركز",        title_en: "About",        path: "/about",        route: "/admin/about" },
  publications: { title_ar: "الإصدارات",        title_en: "Publications", path: "/publications", route: "/admin/publications-page" },
  contact:      { title_ar: "التواصل",          title_en: "Contact",      path: "/contact",      route: "/admin/contact" },
  activities:   { title_ar: "الأنشطة",          title_en: "Activities",   path: "/activities",   route: "/admin/activities-page" },
  fellows:      { title_ar: "زملاء لزام",       title_en: "LIZAM Fellows", path: "/fellows",     route: "/admin/fellows-page" },
};

export default function PagesAdmin() {
  const tr = useTr();
  const { lang } = useLang();

  const [customPages, setCustomPages] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [order, setOrder]             = useState([]); // current nav order (slugs)
  const [hidden, setHidden]           = useState([]); // hidden page slugs
  const [dirty, setDirty]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState("");
  const [newPage, setNewPage]         = useState(null);
  const [permTarget, setPermTarget]   = useState(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  async function load() {
    const [rPages, rSite] = await Promise.all([
      apiCall("get", "/admin/custom-pages"),
      apiCall("get", "/admin/site-settings"),
    ]);
    const pages = rPages.ok ? (rPages.data.items || []) : [];
    const site  = rSite.ok  ? rSite.data                 : {};
    setCustomPages(pages);
    setSiteSettings(site);

    const savedOrder  = site.header_nav_order  || Object.keys(STATIC_PAGE_DEFS);
    const savedHidden = site.hidden_pages       || [];

    // Build complete ordered list: existing order + any new pages not yet in it
    const allSlugs = [
      ...Object.keys(STATIC_PAGE_DEFS),
      ...pages.map(p => p.slug),
    ];
    const merged = [
      ...savedOrder.filter(s => allSlugs.includes(s)),
      ...allSlugs.filter(s => !savedOrder.includes(s)),
    ];
    setOrder(merged);
    setHidden(savedHidden);
    setDirty(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  // ── Helpers ────────────────────────────────────────────────────────────────
  function pageLabel(slug) {
    if (STATIC_PAGE_DEFS[slug]) {
      return lang === "ar"
        ? STATIC_PAGE_DEFS[slug].title_ar
        : STATIC_PAGE_DEFS[slug].title_en;
    }
    const cp = customPages.find(p => p.slug === slug);
    if (cp) return lang === "ar" ? (cp.title_ar || cp.title_en) : (cp.title_en || cp.title_ar);
    return slug;
  }
  function pageType(slug) {
    return STATIC_PAGE_DEFS[slug] ? "static" : "custom";
  }
  function pagePath(slug) {
    return STATIC_PAGE_DEFS[slug]?.path || `/pages/${slug}`;
  }
  function pageEditRoute(slug) {
    if (STATIC_PAGE_DEFS[slug]) return STATIC_PAGE_DEFS[slug].route;
    const cp = customPages.find(p => p.slug === slug);
    return cp ? `/admin/pages/${cp.id}` : null;
  }
  function isVisible(slug) {
    return !hidden.includes(slug);
  }

  // ── Ordering ────────────────────────────────────────────────────────────────
  function moveUp(i) {
    if (i === 0) return;
    const next = [...order];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setOrder(next);
    setDirty(true);
  }
  function moveDown(i) {
    if (i >= order.length - 1) return;
    const next = [...order];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setOrder(next);
    setDirty(true);
  }

  // ── Visibility ─────────────────────────────────────────────────────────────
  function toggleVisible(slug) {
    setHidden(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
    setDirty(true);
  }

  // ── Save all ────────────────────────────────────────────────────────────────
  async function saveAll() {
    setSaving(true);
    // 1. Save nav order + hidden pages to site settings
    await apiCall("patch", "/admin/site-settings", {
      header_nav_order: order.filter(s => !hidden.includes(s)),
      hidden_pages: hidden,
    });
    // 2. Sync custom page `visible` flags — always patch to avoid stale local state
    await Promise.all(
      customPages.map(cp =>
        apiCall("patch", `/admin/custom-pages/${cp.id}`, {
          visible: !hidden.includes(cp.slug),
        })
      )
    );
    invalidateSiteCache("site");
    invalidateSiteCache("customPages");
    // Update customPages visible state locally — don't call load() as it resets order from DB
    setCustomPages(prev => prev.map(cp => ({ ...cp, visible: !hidden.includes(cp.slug) })));
    setDirty(false);
    setSaving(false);
    setMsg(tr("تم حفظ التغييرات ✓", "Changes saved ✓"));
    setTimeout(() => setMsg(""), 2500);
  }

  function resetAll() {
    load();
  }

  // ── Create custom page ──────────────────────────────────────────────────────
  async function createPage() {
    if (!newPage?.slug) return;
    const r = await apiCall("post", "/admin/custom-pages", newPage);
    if (!r.ok) return;

    // Fetch latest state from DB to build the updated order
    const [rPages, rSite] = await Promise.all([
      apiCall("get", "/admin/custom-pages"),
      apiCall("get", "/admin/site-settings"),
    ]);
    const pages   = rPages.ok ? (rPages.data.items || []) : [];
    const site    = rSite.ok  ? rSite.data : {};
    const savedOrder  = site.header_nav_order || Object.keys(STATIC_PAGE_DEFS);
    const savedHidden = site.hidden_pages     || [];

    const allSlugs  = [...Object.keys(STATIC_PAGE_DEFS), ...pages.map(p => p.slug)];
    const newOrder  = [
      ...savedOrder.filter(s => allSlugs.includes(s)),
      ...allSlugs.filter(s => !savedOrder.includes(s)),
    ];
    const visibleOrder = newOrder.filter(s => !savedHidden.includes(s));

    // Auto-save so the new page appears in the header immediately
    await apiCall("patch", "/admin/site-settings", {
      header_nav_order: visibleOrder,
      hidden_pages: savedHidden,
    });
    invalidateSiteCache("site");
    invalidateSiteCache("customPages");

    setNewPage(null);
    await load();
    setMsg(tr("تم إنشاء الصفحة وإضافتها للقائمة ✓", "Page created and added to navigation ✓"));
    setTimeout(() => setMsg(""), 3000);
  }

  // ── Delete custom page ──────────────────────────────────────────────────────
  async function permanentDelete() {
    if (!permTarget) return;
    const r = await apiCall("delete", `/admin/custom-pages/${permTarget.id}/permanent`);
    if (!r.ok) throw new Error(r.error);
    await load();
  }

  return (
    <AdminPage
      title={tr("مدير الصفحات", "Pages Manager")}
      subtitle={tr("رتّب وأظهر أو أخفِ صفحات الموقع", "Reorder and control page visibility")}
      helpAr="رتّب الصفحات بالأسهم — الترتيب هنا يعكس ترتيب القائمة العلوية. اضغط إظهار/إخفاء للتحكم في ظهور كل صفحة. اضغط حفظ التغييرات لتطبيق التغييرات."
      helpEn="Use arrows to reorder — this order reflects the top navigation. Toggle visibility per page. Click Save to apply."
      actions={
        <button
          type="button"
          className="lz-btn-primary"
          onClick={() => setNewPage({ title_ar: "", title_en: "", slug: "", visible: true, sections: [] })}
          data-testid="new-page-btn"
        >
          <Plus size={15} />
          <span>{tr("صفحة جديدة", "New page")}</span>
        </button>
      }
    >
      {msg && <div className="mb-4 text-[13px] text-green-700 font-medium">{msg}</div>}

      {/* ── New page form ── */}
      {newPage && (
        <div className="mb-8 border border-navy/20 bg-white p-6">
          <h3 className="lz-h3 mb-5">{tr("إنشاء صفحة جديدة", "Create new page")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <Field label={tr("العنوان بالعربية", "Title (Arabic)")}>
              <TextInput value={newPage.title_ar} onChange={v => setNewPage({ ...newPage, title_ar: v })} dir="rtl" testid="new-page-title-ar" />
            </Field>
            <Field label={tr("العنوان بالإنجليزية", "Title (English)")}>
              <TextInput value={newPage.title_en} onChange={v => setNewPage({ ...newPage, title_en: v })} testid="new-page-title-en" />
            </Field>
            <Field label={tr("المعرّف (slug) *", "Slug *")} hint={tr("مثال: news أو team-page", "e.g. news or team-page")}>
              <TextInput value={newPage.slug} onChange={v => setNewPage({ ...newPage, slug: v.toLowerCase().replace(/\s+/g, "-") })} dir="ltr" testid="new-page-slug" />
            </Field>
          </div>
          <div className="flex gap-3">
            <button type="button" className="lz-btn-primary" onClick={createPage} data-testid="new-page-save">
              {tr("إنشاء الصفحة", "Create page")}
            </button>
            <button type="button" className="lz-btn-ghost" onClick={() => setNewPage(null)}>{tr("إلغاء", "Cancel")}</button>
          </div>
        </div>
      )}

      {/* ── Unified pages table ── */}
      <div className="bg-white border border-rule mb-6">
        <div className="px-5 py-3 border-b border-rule bg-paper">
          <span className="text-[11px] uppercase tracking-[0.2em] text-mute">
            {tr("كل الصفحات — رتّبها واضبط ظهورها", "All pages — reorder and control visibility")}
          </span>
        </div>

        {order.length === 0 ? (
          <div className="p-10 text-mute text-center">{tr("جارٍ التحميل…", "Loading…")}</div>
        ) : (
          <table className="w-full text-[14px]" data-testid="pages-table">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.18em] text-mute border-b border-rule">
                <th className="p-4 w-20 text-center">{tr("الترتيب", "Order")}</th>
                <th className="text-start p-4">{tr("الصفحة", "Page")}</th>
                <th className="text-start p-4">{tr("المسار", "Path")}</th>
                <th className="text-start p-4">{tr("النوع", "Type")}</th>
                <th className="text-start p-4">{tr("الظهور", "Visibility")}</th>
                <th className="text-start p-4">{tr("إجراءات", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {order.map((slug, i) => {
                const visible = isVisible(slug);
                const type    = pageType(slug);
                const editRoute = pageEditRoute(slug);
                const cp = type === "custom" ? customPages.find(p => p.slug === slug) : null;

                return (
                  <tr
                    key={slug}
                    className={`border-b border-rule last:border-0 transition-colors ${!visible ? "opacity-50" : "hover:bg-ivory-cream"}`}
                    data-testid={`page-row-${slug}`}
                  >
                    {/* Order arrows */}
                    <td className="p-3 text-center">
                      <div className="inline-flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveUp(i)}
                          disabled={i === 0}
                          className="w-8 h-8 flex items-center justify-center border border-rule bg-white hover:border-brass hover:text-brass hover:bg-ivory-cream text-navy-deep disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(i)}
                          disabled={i >= order.length - 1}
                          className="w-8 h-8 flex items-center justify-center border border-rule bg-white hover:border-brass hover:text-brass hover:bg-ivory-cream text-navy-deep disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronDown size={15} />
                        </button>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="p-4 font-medium text-navy-deep">
                      {pageLabel(slug)}
                    </td>

                    {/* Path */}
                    <td className="p-4 text-mute text-[12.5px] font-mono">
                      {pagePath(slug)}
                    </td>

                    {/* Type badge */}
                    <td className="p-4">
                      <span className={`text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 border ${
                        type === "static"
                          ? "bg-paper border-rule text-mute"
                          : "bg-amber-50 border-amber-200 text-amber-800"
                      }`}>
                        {type === "static" ? tr("ثابتة", "Static") : tr("مخصصة", "Custom")}
                      </span>
                    </td>

                    {/* Visibility toggle */}
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => toggleVisible(slug)}
                        className={`flex items-center gap-1.5 text-[12.5px] transition-colors ${
                          visible ? "text-green-700 hover:text-green-900" : "text-mute hover:text-navy"
                        }`}
                        data-testid={`toggle-${slug}`}
                      >
                        {visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        {visible ? tr("ظاهرة", "Visible") : tr("مخفية", "Hidden")}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {editRoute && (
                          <Link
                            to={editRoute}
                            className="inline-flex items-center gap-1 text-navy hover:text-brass lz-linkline text-[12.5px]"
                            data-testid={`edit-${slug}`}
                          >
                            {type === "custom" ? <Layout size={12} /> : <Pencil size={12} />}
                            {type === "custom"
                              ? tr("الأقسام", "Sections")
                              : tr("المحتوى", "Content")}
                          </Link>
                        )}
                        {type === "custom" && cp && (
                          <button
                            type="button"
                            onClick={() => setPermTarget(cp)}
                            className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 lz-linkline text-[12.5px]"
                            data-testid={`delete-${slug}`}
                          >
                            <Trash2 size={12} />
                            {tr("حذف", "Delete")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Save bar */}
      <SaveBar
        dirty={dirty}
        saving={saving}
        onSave={saveAll}
        onReset={resetAll}
        savedMessage={msg}
      />

      <ConfirmDeleteDialog
        open={!!permTarget}
        onClose={() => setPermTarget(null)}
        onConfirm={permanentDelete}
        entityName={permTarget?.title_ar || permTarget?.title_en || permTarget?.slug}
        warningAr="سيتم حذف الصفحة وكل أقسامها نهائياً."
        warningEn="The page and all its sections will be permanently deleted."
        testid="page-confirm-delete"
      />
    </AdminPage>
  );
}

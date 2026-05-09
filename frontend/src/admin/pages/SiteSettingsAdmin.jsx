import { useEffect, useMemo, useState } from "react";
import { AdminPage, Field, TextInput, TextArea, Select, SaveBar, useDirtyForm, apiCall } from "@/admin/components/AdminUI";
import { ReorderControls, moveItem } from "@/admin/components/ReorderControls";
import { useLang } from "@/i18n/LanguageContext";
import { invalidateSiteCache } from "@/hooks/useSiteSettings";

const ALL_NAV_KEYS = ["home", "publications", "about", "contact"];
const DEFAULT_NAV_ORDER = ["home", "publications", "about", "contact"];

export default function SiteSettingsAdmin() {
  const { lang } = useLang();
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const form = useDirtyForm({});
  const tr = (ar, en) => (lang === "ar" ? ar : en);

  const NAV_LABELS = useMemo(() => ({
    home:         tr("الرئيسية", "Home"),
    publications: tr("الإصدارات", "Publications"),
    about:        tr("عن المركز", "About"),
    contact:      tr("تواصل", "Contact"),
  }), [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const rawNav = form.value.header_nav_order;
  const navOrder = Array.isArray(rawNav) && rawNav.length
    ? rawNav.filter((k) => ALL_NAV_KEYS.includes(k))
    : DEFAULT_NAV_ORDER;
  const navHidden = ALL_NAV_KEYS.filter((k) => !navOrder.includes(k));

  function moveNav(from, to) {
    form.patch("header_nav_order", moveItem(navOrder, from, to));
  }
  function hideNav(key) {
    form.patch("header_nav_order", navOrder.filter((k) => k !== key));
  }
  function showNav(key) {
    form.patch("header_nav_order", [...navOrder, key]);
  }

  useEffect(() => {
    apiCall("get", "/admin/site-settings").then((r) => {
      if (r.ok) form.commit(r.data || {});
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const payload = {
      site_name_ar: form.value.site_name_ar, site_name_en: form.value.site_name_en,
      tagline_ar: form.value.tagline_ar, tagline_en: form.value.tagline_en,
      default_language: form.value.default_language,
      contact_email: form.value.contact_email, phone: form.value.phone,
      address_ar: form.value.address_ar, address_en: form.value.address_en,
      footer_text_ar: form.value.footer_text_ar, footer_text_en: form.value.footer_text_en,
      social_links: form.value.social_links || {},
      header_nav_order: form.value.header_nav_order || undefined,
    };
    const r = await apiCall("patch", "/admin/site-settings", payload);
    setSaving(false);
    if (r.ok) { form.commit(r.data); invalidateSiteCache("site"); setMsg(tr("تم الحفظ ✓ — حدّث الموقع العام لرؤية التغييرات.", "Saved ✓ — refresh public site to see updates.")); setTimeout(() => setMsg(""), 3500); }
    else setMsg(`${tr("خطأ", "Error")}: ${r.error}`);
  }

  if (!loaded) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  return (
    <AdminPage title={tr("إعدادات الموقع", "Site Settings")} subtitle={tr("الإعدادات العامة", "General")}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        <Field label={tr("اسم الموقع بالعربية", "Arabic site name")}><TextInput value={form.value.site_name_ar} onChange={(v) => form.patch("site_name_ar", v)} dir="rtl" testid="site-name-ar" /></Field>
        <Field label={tr("اسم الموقع بالإنجليزية", "English site name")}><TextInput value={form.value.site_name_en} onChange={(v) => form.patch("site_name_en", v)} dir="ltr" testid="site-name-en" /></Field>
        <Field label={tr("الشعار التعريفي بالعربية", "Arabic tagline")}><TextInput value={form.value.tagline_ar} onChange={(v) => form.patch("tagline_ar", v)} dir="rtl" testid="tagline-ar" /></Field>
        <Field label={tr("الشعار التعريفي بالإنجليزية", "English tagline")}><TextInput value={form.value.tagline_en} onChange={(v) => form.patch("tagline_en", v)} dir="ltr" testid="tagline-en" /></Field>
        <Field label={tr("اللغة الافتراضية", "Default language")}>
          <Select value={form.value.default_language} onChange={(v) => form.patch("default_language", v)} options={[{value:"ar",label:tr("العربية","Arabic")},{value:"en",label:tr("الإنجليزية","English")}]} testid="default-lang" />
        </Field>
        <Field label={tr("البريد الإلكتروني للتواصل", "Contact email")}><TextInput type="email" value={form.value.contact_email} onChange={(v) => form.patch("contact_email", v)} testid="contact-email" /></Field>
        <Field label={tr("رقم الهاتف", "Phone")}><TextInput value={form.value.phone} onChange={(v) => form.patch("phone", v)} testid="phone" /></Field>
        <Field label={tr("العنوان بالعربية", "Arabic address")}><TextInput value={form.value.address_ar} onChange={(v) => form.patch("address_ar", v)} dir="rtl" testid="address-ar" /></Field>
        <Field label={tr("العنوان بالإنجليزية", "English address")}><TextInput value={form.value.address_en} onChange={(v) => form.patch("address_en", v)} dir="ltr" testid="address-en" /></Field>
        <Field label={tr("نص التذييل بالعربية", "Arabic footer text")}><TextArea value={form.value.footer_text_ar} onChange={(v) => form.patch("footer_text_ar", v)} dir="rtl" rows={2} testid="footer-ar" /></Field>
        <Field label={tr("نص التذييل بالإنجليزية", "English footer text")}><TextArea value={form.value.footer_text_en} onChange={(v) => form.patch("footer_text_en", v)} rows={2} testid="footer-en" /></Field>
      </div>

      <h3 className="lz-h3 mt-12">{tr("ترتيب القائمة الرئيسية في الهيدر", "Header navigation order")}</h3>
      <p className="text-[13px] text-mute mt-2 max-w-[60ch]">
        {tr(
          "رتّب عناصر القائمة كما تظهر للزائر، أو أخفِ عنصراً بالضغط على \"إخفاء\". العناصر المخفية تختفي تماماً من الهيدر العام.",
          "Reorder the items as they appear to visitors, or hide an item by clicking \"Hide\". Hidden items disappear from the public header entirely."
        )}
      </p>
      <div className="mt-5 max-w-[640px] bg-white border border-rule" data-testid="header-nav-order">
        <ul className="divide-y divide-rule">
          {navOrder.map((key, idx) => (
            <li key={key} className="flex items-center gap-3 px-5 py-2.5" data-testid={`nav-order-row-${key}`}>
              <span className="text-[12px] text-mute tabular-nums w-6">{idx + 1}</span>
              <span className="flex-1 text-[14px] text-navy-deep">{NAV_LABELS[key]}</span>
              <ReorderControls index={idx} total={navOrder.length} onMove={moveNav} testid={`nav-order-${key}`} />
              <button type="button" onClick={() => hideNav(key)}
                className="text-[12px] text-mute hover:text-red-700 ms-2"
                data-testid={`nav-hide-${key}`}>
                {tr("إخفاء", "Hide")}
              </button>
            </li>
          ))}
        </ul>
        {navHidden.length > 0 && (
          <div className="border-t border-rule px-5 py-3 bg-paper">
            <div className="text-[11.5px] uppercase tracking-[0.16em] text-mute mb-2">{tr("مخفية", "Hidden")}</div>
            <div className="flex flex-wrap gap-2">
              {navHidden.map((key) => (
                <button key={key} type="button" onClick={() => showNav(key)}
                  className="text-[12.5px] px-3 py-1 border border-rule hover:border-navy bg-white"
                  data-testid={`nav-show-${key}`}>
                  + {NAV_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <h3 className="lz-h3 mt-12">{tr("روابط التواصل الاجتماعي", "Social Links")}</h3>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        {["twitter","linkedin","youtube","facebook","instagram"].map((k) => (
          <Field key={k} label={k.charAt(0).toUpperCase()+k.slice(1)}>
            <TextInput value={form.value.social_links?.[k]} onChange={(v) => form.patch("social_links", {...(form.value.social_links||{}), [k]: v})} testid={`social-${k}`} />
          </Field>
        ))}
      </div>

      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
    </AdminPage>
  );
}

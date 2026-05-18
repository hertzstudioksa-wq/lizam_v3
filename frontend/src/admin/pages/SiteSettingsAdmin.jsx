import { useEffect, useState } from "react";
import { AdminPage, Field, TextInput, TextArea, Select, SaveBar, Toggle, useDirtyForm, apiCall } from "@/admin/components/AdminUI";
import { useLang } from "@/i18n/LanguageContext";
import { invalidateSiteCache } from "@/hooks/useSiteSettings";

const TOGGLE_ROWS = (tr) => [
  { key: "registration",
    label: tr("تسجيل المستخدمين الجدد", "User registration"),
    tip: tr("عند إيقافه: صفحة /register تختفي ويرفض الخادم أي تسجيل جديد.", "When OFF: /register becomes unavailable and new sign-ups are rejected.") },
  { key: "gated_content",
    label: tr("قفل المحتوى (يطلب تسجيل دخول)", "Gated content"),
    tip: tr("المفتاح الرئيسي لنظام قفل الإصدارات. عند الإيقاف تُفتح كل الإصدارات للجميع.", "Master switch for content gating. When OFF, all publications are open to everyone.") },
  { key: "google_login",
    label: tr("تسجيل الدخول بـ Google", "Google login"),
    tip: tr("يفعّل زرار الدخول بـ Google في صفحة تسجيل الدخول.", "Enables the Google sign-in button on /login.") },
  { key: "pdf_download",
    label: tr("تحميل ملفات PDF", "PDF downloads"),
    tip: tr("عند الإيقاف تختفي أزرار التحميل ويرفض الخادم تنزيل أي PDF.", "When OFF, all download buttons disappear and PDF requests are rejected.") },
  { key: "research_responses",
    label: tr("استقبال الردود البحثية", "Research responses"),
    tip: tr("تفعيل نموذج إرسال الردود في صفحة كل إصدار.", "Enables the response submission form on each publication page.") },
  { key: "public_responses",
    label: tr("عرض الردود المعتمدة للعموم", "Show approved responses publicly"),
    tip: tr("تظهر الردود المعتمدة في أسفل صفحة الإصدار.", "Approved responses appear at the bottom of each publication page.") },
];

export default function SiteSettingsAdmin() {
  const { lang } = useLang();
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const form = useDirtyForm({});
  const [toggles, setToggles] = useState(null);
  const [toggleSaving, setToggleSaving] = useState(false);
  const tr = (ar, en) => (lang === "ar" ? ar : en);

  useEffect(() => {
    Promise.all([
      apiCall("get", "/admin/site-settings"),
      apiCall("get", "/admin/toggles"),
    ]).then(([rSite, rToggles]) => {
      if (rSite.ok) form.commit(rSite.data || {});
      if (rToggles.ok) setToggles(rToggles.data);
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
    };
    const r = await apiCall("patch", "/admin/site-settings", payload);
    setSaving(false);
    if (r.ok) { form.commit(r.data); invalidateSiteCache("site"); setMsg(tr("تم الحفظ ✓", "Saved ✓")); setTimeout(() => setMsg(""), 3500); }
    else setMsg(`${tr("خطأ", "Error")}: ${r.error}`);
  }

  async function saveToggle(next) {
    setToggles(next);
    setToggleSaving(true);
    await apiCall("patch", "/admin/toggles", next);
    setToggleSaving(false);
    invalidateSiteCache("site");
  }

  if (!loaded) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  return (
    <AdminPage title={tr("إعدادات الموقع", "Site Settings")} subtitle={tr("الإعدادات العامة", "General")}>

      {/* ── General info ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        <Field label={tr("اسم الموقع بالعربية", "Arabic site name")}><TextInput value={form.value.site_name_ar} onChange={(v) => form.patch("site_name_ar", v)} dir="rtl" testid="site-name-ar" /></Field>
        <Field label={tr("اسم الموقع بالإنجليزية", "English site name")}><TextInput value={form.value.site_name_en} onChange={(v) => form.patch("site_name_en", v)} dir="ltr" testid="site-name-en" /></Field>
        <Field label={tr("الشعار التعريفي بالعربية", "Arabic tagline")}><TextInput value={form.value.tagline_ar} onChange={(v) => form.patch("tagline_ar", v)} dir="rtl" rows={2} testid="tagline-ar" /></Field>
        <Field label={tr("الشعار التعريفي بالإنجليزية", "English tagline")}><TextInput value={form.value.tagline_en} onChange={(v) => form.patch("tagline_en", v)} dir="ltr" rows={2} testid="tagline-en" /></Field>
        <Field label={tr("اللغة الافتراضية", "Default language")}>
          <Select value={form.value.default_language} onChange={(v) => form.patch("default_language", v)} options={[{value:"ar",label:tr("العربية","Arabic")},{value:"en",label:tr("الإنجليزية","English")}]} testid="default-lang" />
        </Field>
        <Field label={tr("البريد الإلكتروني للتواصل", "Contact email")}><TextInput type="email" value={form.value.contact_email} onChange={(v) => form.patch("contact_email", v)} testid="contact-email" /></Field>
        <Field label={tr("رقم الهاتف", "Phone")}><TextInput value={form.value.phone} onChange={(v) => form.patch("phone", v)} testid="phone" /></Field>
        <Field label={tr("العنوان بالعربية", "Arabic address")}><TextInput value={form.value.address_ar} onChange={(v) => form.patch("address_ar", v)} dir="rtl" rows={2} testid="address-ar" /></Field>
        <Field label={tr("العنوان بالإنجليزية", "English address")}><TextInput value={form.value.address_en} onChange={(v) => form.patch("address_en", v)} dir="ltr" rows={2} testid="address-en" /></Field>
        <Field label={tr("نص التذييل بالعربية", "Arabic footer text")}><TextArea value={form.value.footer_text_ar} onChange={(v) => form.patch("footer_text_ar", v)} dir="rtl" rows={2} testid="footer-ar" /></Field>
        <Field label={tr("نص التذييل بالإنجليزية", "English footer text")}><TextArea value={form.value.footer_text_en} onChange={(v) => form.patch("footer_text_en", v)} rows={2} testid="footer-en" /></Field>
      </div>

      {/* ── Social links ── */}
      <h3 className="lz-h3 mt-12">{tr("روابط التواصل الاجتماعي", "Social Links")}</h3>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        {["twitter","linkedin","youtube","facebook","instagram"].map((k) => (
          <Field key={k} label={k.charAt(0).toUpperCase()+k.slice(1)}>
            <TextInput value={form.value.social_links?.[k]} onChange={(v) => form.patch("social_links", {...(form.value.social_links||{}), [k]: v})} testid={`social-${k}`} />
          </Field>
        ))}
      </div>

      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />

      {/* ── Feature toggles ── */}
      <div className="mt-14" style={{ borderTop: "1px solid var(--lz-rule, #E8E2D9)", paddingTop: "3rem" }}>
        <h3 className="lz-h3 mb-1">{tr("مفاتيح الميزات", "Feature Toggles")}</h3>
        <p className="text-[13px] text-mute mb-8 max-w-[60ch]">
          {tr("تنعكس التغييرات فوراً على الموقع بعد التفعيل/الإيقاف.", "Changes apply to the site immediately on toggle.")}
        </p>
        {toggleSaving && <div className="mb-3 text-[13px] text-mute">{tr("جارٍ الحفظ…", "Saving…")}</div>}
        {toggles && (
          <div className="space-y-2 max-w-xl">
            {TOGGLE_ROWS(tr).map(({ key, label, tip }) => (
              <div key={key} className="py-1">
                <Toggle
                  checked={!!toggles[key]}
                  onChange={(v) => saveToggle({ ...toggles, [key]: v })}
                  label={label}
                  testid={`toggle-${key}`}
                />
                {tip && <p className="text-[12px] text-mute ms-11 mt-0.5 leading-relaxed">{tip}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

    </AdminPage>
  );
}

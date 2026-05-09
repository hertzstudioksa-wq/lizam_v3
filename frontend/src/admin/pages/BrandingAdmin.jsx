import { useEffect, useState } from "react";
import { AdminPage, Field, TextInput, Select, SaveBar, useDirtyForm, apiCall } from "@/admin/components/AdminUI";
import { useLang } from "@/i18n/LanguageContext";
import { api, formatApiError } from "@/lib/api";
import { invalidateSiteCache } from "@/hooks/useSiteSettings";

const FONT_OPTIONS = [
  { value: "Thmanyah Sans", label_en: "Thmanyah Sans (UI / body — recommended default)", label_ar: "ثمانية سانس (الافتراضي — واجهة ونص)" },
  { value: "Thmanyah Serif Display", label_en: "Thmanyah Serif Display (editorial headings)", label_ar: "ثمانية سيرف Display (عناوين تحريرية)" },
  { value: "Thmanyah Serif Text", label_en: "Thmanyah Serif Text (long-form reading)", label_ar: "ثمانية سيرف Text (قراءة طويلة)" },
  { value: "IBM Plex Sans Arabic", label_en: "IBM Plex Sans Arabic (fallback)", label_ar: "IBM Plex Sans Arabic (احتياطي)" },
  { value: "Inter", label_en: "Inter (English UI fallback)", label_ar: "Inter (احتياطي للواجهة الإنجليزية)" },
  { value: "Source Serif 4", label_en: "Source Serif 4 (English editorial fallback)", label_ar: "Source Serif 4 (احتياطي تحريري إنجليزي)" },
];

const THEMES = [
  {
    key: "A",
    label_en: "Theme A — Baseline",
    label_ar: "الثيمة A — الأساسية",
    description_en: "Current public design (split-screen hero, modern editorial). Maintained as baseline.",
    description_ar: "التصميم العام الحالي. تبقى متاحة كثيمة أساسية.",
  },
  {
    key: "B",
    label_en: "Theme B — Premium Editorial",
    label_ar: "الثيمة B — التحريرية الفاخرة",
    description_en: "Refined institutional editorial. Single-layered hero, antique gold accents, refined hover states.",
    description_ar: "تصميم تحريري مؤسسي راقٍ مع تفاصيل ذهبية، يمنح الصفحات حضوراً أكثر فخامة.",
  },
];

export default function BrandingAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const form = useDirtyForm({});
  const [siteForm, setSiteForm] = useState({});
  const [siteDirty, setSiteDirty] = useState(false);

  useEffect(() => {
    apiCall("get", "/admin/branding").then((r) => { if (r.ok) form.commit(r.data || {}); setLoaded(true); });
    apiCall("get", "/admin/site-settings").then((r) => {
      if (r.ok) setSiteForm({ active_theme: r.data?.active_theme || "A" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const r = await apiCall("patch", "/admin/branding", form.value);
    let msgPrefix = "";
    if (siteDirty) {
      const r2 = await apiCall("patch", "/admin/site-settings", { active_theme: siteForm.active_theme });
      if (!r2.ok) { setSaving(false); setMsg(`${tr("خطأ","Error")}: ${r2.error}`); return; }
      setSiteDirty(false);
      msgPrefix = tr("الثيمة + ", "Theme + ");
    }
    setSaving(false);
    if (r.ok) { form.commit(r.data); invalidateSiteCache("site"); setMsg(`${msgPrefix}${tr("تم الحفظ ✓ — حدّث الموقع العام لرؤية التغييرات.", "Saved ✓ — refresh the public site to see updates.")}`); setTimeout(() => setMsg(""), 4000); }
    else setMsg(`${tr("خطأ","Error")}: ${r.error}`);
  }

  async function uploadImage(key, file) {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      form.patch(key, data.url);
    } catch (e) {
      setMsg(`${tr("خطأ في الرفع", "Upload error")}: ${formatApiError(e.response?.data?.detail) || e.message}`);
    }
  }

  function selectTheme(key) {
    setSiteForm((s) => ({ ...s, active_theme: key }));
    setSiteDirty(true);
  }

  if (!loaded) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  const ColorRow = ({ k }) => (
    <div className="flex items-center gap-3">
      <input type="color" value={form.value[k] || "#000000"} onChange={(e) => form.patch(k, e.target.value)} className="h-10 w-12 p-0 border border-rule cursor-pointer" data-testid={`color-${k}`} />
      <TextInput value={form.value[k]} onChange={(v) => form.patch(k, v)} testid={`color-text-${k}`} />
    </div>
  );

  return (
    <AdminPage title={tr("الهوية والتصميم", "Design & Branding")} subtitle={tr("الهوية البصرية · الثيمة · الخطوط", "Visual identity · Theme · Fonts")}
      helpAr="الهوية البصرية الكاملة للموقع: ثيمة العرض، الخط الافتراضي، الشعار، والألوان الأساسية. أي تغيير ينعكس فوراً على الموقع العام بعد الحفظ بدون إعادة تحميل."
      helpEn="The full visual identity: theme, default font, logo, and core palette. Saved changes apply to the public site instantly without a hard reload.">
      {/* Theme Selector */}
      <section className="mb-12" data-testid="theme-selector-section">
        <div className="flex items-baseline gap-3 mb-4">
          <h3 className="text-[18px] font-medium text-navy-deep">{tr("ثيمة الموقع العام", "Public site theme")}</h3>
          <span className="text-[12.5px] text-mute">— {tr("تُطبَّق على الموقع بالكامل", "applied globally")}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[1100px]">
          {THEMES.map((t) => {
            const active = (siteForm.active_theme || "A") === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => selectTheme(t.key)}
                className={`text-start p-6 border-2 transition-all duration-300 ${active ? "border-brass bg-ivory-cream/40" : "border-rule hover:border-navy/40 bg-white"}`}
                data-testid={`theme-option-${t.key}`}
                data-active={active ? "true" : "false"}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] tracking-[0.22em] uppercase text-brass font-semibold">{tr("الثيمة", "Theme")} {t.key}</div>
                    <div className="mt-1 text-[18px] font-medium text-navy-deep" style={{ fontFamily: t.key === "B" ? '"Thmanyah Serif Display", serif' : '"Thmanyah Sans", sans-serif' }}>
                      {lang === "ar" ? t.label_ar : t.label_en}
                    </div>
                  </div>
                  <div className={`shrink-0 h-5 w-5 border-2 ${active ? "border-brass bg-brass" : "border-rule"}`} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-1 h-16 border border-rule overflow-hidden">
                  {t.key === "A" ? (
                    <>
                      <div style={{ background: "#121A2A" }} />
                      <div style={{ background: "#121A2A" }} />
                      <div style={{ background: "#FAF9F6" }} />
                    </>
                  ) : (
                    <>
                      <div style={{ background: "#F9F7F3" }} />
                      <div style={{ background: "#F9F7F3", borderTop: "2px solid #B4914A" }} />
                      <div style={{ background: "#0A111C" }} />
                    </>
                  )}
                </div>
                <p className="mt-4 text-[13px] text-ink/75 leading-relaxed">{lang === "ar" ? t.description_ar : t.description_en}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Font Management */}
      <section className="mb-12" data-testid="font-management-section">
        <div className="flex items-baseline gap-3 mb-2">
          <h3 className="text-[18px] font-medium text-navy-deep">{tr("إدارة الخطوط", "Font management")}</h3>
          <span className="text-[12.5px] text-mute">— {tr("خطوط ثمانية هي الافتراضية. الرفع المخصص سيُتاح لاحقاً.", "Thmanyah is the default. Custom upload coming soon.")}</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1100px] p-6 border border-rule bg-white" style={{ background: form.value.background_color || "#fff" }}>
          <Field label={tr("الخط العربي الحالي", "Active Arabic font")} hint={tr("يُطبَّق على كل العناوين والنص العربي في الموقع العام", "Applied to Arabic UI, headings and body on public site")}>
            <Select value={form.value.font_ar || "Thmanyah Sans"} onChange={(v) => form.patch("font_ar", v)} options={FONT_OPTIONS.map(f => ({value: f.value, label: lang==="ar"?f.label_ar:f.label_en}))} testid="font-ar" />
            <div className="mt-3 p-3 border border-rule bg-ivory-cream/30 text-[18px]" style={{ fontFamily: form.value.font_ar || "Thmanyah Sans", direction: "rtl" }}>
              معاينة الخط العربي · مركز لزام للدراسات القانونية
            </div>
          </Field>
          <Field label={tr("الخط الإنجليزي الحالي", "Active English font")} hint={tr("يُطبَّق على كل النص الإنجليزي", "Applied to all English UI and editorial text")}>
            <Select value={form.value.font_en || "Thmanyah Sans"} onChange={(v) => form.patch("font_en", v)} options={FONT_OPTIONS.map(f => ({value: f.value, label: lang==="ar"?f.label_ar:f.label_en}))} testid="font-en" />
            <div className="mt-3 p-3 border border-rule bg-ivory-cream/30 text-[16px]" style={{ fontFamily: form.value.font_en || "Thmanyah Sans" }}>
              English preview · LIZAM Center for Legal Research
            </div>
          </Field>
          <div className="lg:col-span-2 mt-2 p-4 border-l-2 border-brass bg-paper text-[13px] text-mute leading-relaxed">
            <strong className="text-navy-deep">{tr("رفع خط مخصص — قيد الإعداد.", "Custom font upload — pending.")}</strong> {tr("البنية جاهزة لاستقبال ملفات .woff2، لكن واجهة الرفع ستُضاف في مرحلة لاحقة. حالياً يُرجى الاختيار من القائمة أعلاه.", "The CMS supports custom .woff2 uploads; the workflow is scheduled for a later checkpoint. For now please pick from the curated list above.")}
          </div>
          <div className="lg:col-span-2">
            <button
              type="button"
              onClick={() => { form.patch("font_ar", "Thmanyah Sans"); form.patch("font_en", "Thmanyah Sans"); }}
              className="text-[13px] text-mute hover:text-navy underline underline-offset-4"
              data-testid="font-revert-default"
            >
              {tr("إعادة إلى خط ثمانية الافتراضي", "Revert to default Thmanyah")}
            </button>
          </div>
        </div>
      </section>

      {/* Branding (logo + colors) */}
      <h3 className="text-[18px] font-medium text-navy-deep mb-4">{tr("الشعارات والألوان", "Logos & colors")}</h3>
      <div className="mb-10 p-6 border border-rule" style={{ background: form.value.background_color || "#F7F8FA" }}>
        <div className="flex items-center gap-4">
          {form.value.logo_url && <img src={form.value.logo_url} alt="" style={{ height: 44, width: "auto" }} />}
          <div>
            <div className="lz-eyebrow" style={{ color: form.value.primary_color }}>{tr("معاينة مباشرة", "Live preview")}</div>
            <div className="text-[20px]" style={{ color: form.value.secondary_color, fontFamily: form.value.font_ar || "inherit" }}>مركز لزام للدراسات القانونية</div>
            <div className="text-[14px] mt-1" style={{ color: form.value.muted_text_color || "#667085" }}>{tr("مركز بحثي سعودي · مرجع موثوق للدراسات القانونية", "Saudi research center · A trusted reference for legal studies")}</div>
            <button type="button" className="mt-3 px-4 py-2 text-[13px]" style={{ background: form.value.primary_color, color: "#fff" }}>{tr("إجراء رئيسي", "Primary action")}</button>
            <button type="button" className="mt-3 ms-2 px-4 py-2 text-[13px] border" style={{ borderColor: form.value.accent_color, color: form.value.accent_color }}>{tr("إبرازي", "Accent")}</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1100px]">
        <Field label={tr("الشعار (النسخة الداكنة)", "Logo (dark version)")} hint={tr("يُستخدم على الخلفيات الفاتحة", "Used on light backgrounds")}>
          <div className="space-y-2">
            <TextInput value={form.value.logo_url} onChange={(v) => form.patch("logo_url", v)} testid="logo-url" />
            <input type="file" accept="image/*" onChange={(e) => uploadImage("logo_url", e.target.files?.[0])} className="text-[13px]" data-testid="logo-upload" />
          </div>
        </Field>
        <Field label={tr("الشعار (النسخة الفاتحة)", "Logo (light version)")} hint={tr("يُستخدم على الخلفيات الداكنة", "Used on dark backgrounds")}>
          <div className="space-y-2">
            <TextInput value={form.value.logo_light_url} onChange={(v) => form.patch("logo_light_url", v)} testid="logo-light-url" />
            <input type="file" accept="image/*" onChange={(e) => uploadImage("logo_light_url", e.target.files?.[0])} className="text-[13px]" data-testid="logo-light-upload" />
          </div>
        </Field>
        <Field label={tr("أيقونة المتصفح (Favicon)", "Favicon")}>
          <div className="space-y-2">
            <TextInput value={form.value.favicon_url} onChange={(v) => form.patch("favicon_url", v)} testid="favicon-url" />
            <input type="file" accept="image/*,.ico" onChange={(e) => uploadImage("favicon_url", e.target.files?.[0])} className="text-[13px]" data-testid="favicon-upload" />
          </div>
        </Field>

        <Field label={tr("اللون الأساسي (كحلي)", "Primary (navy)")}><ColorRow k="primary_color" /></Field>
        <Field label={tr("اللون الثانوي (كحلي غامق)", "Secondary (deep navy)")}><ColorRow k="secondary_color" /></Field>
        <Field label={tr("اللون الإبرازي (نحاسي)", "Accent (brass)")}><ColorRow k="accent_color" /></Field>
        <Field label={tr("لون الخلفية", "Background")}><ColorRow k="background_color" /></Field>
        <Field label={tr("لون النص", "Text color")}><ColorRow k="text_color" /></Field>
        <Field label={tr("لون النص الخافت", "Muted text")}><ColorRow k="muted_text_color" /></Field>
      </div>

      <SaveBar dirty={form.dirty || siteDirty} saving={saving} onSave={save} onReset={() => { form.reset(); setSiteDirty(false); }} savedMessage={msg} />
    </AdminPage>
  );
}

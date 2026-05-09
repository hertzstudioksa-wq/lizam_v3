import { useEffect, useState } from "react";
import { AdminPage, Field, TextArea, SaveBar, useDirtyForm, apiCall, TextInput } from "@/admin/components/AdminUI";
import { ReorderControls, moveItem } from "@/admin/components/ReorderControls";
import { useLang } from "@/i18n/LanguageContext";
import { invalidateSiteCache } from "@/hooks/useSiteSettings";

const SECTIONS = ["hero", "about", "mission", "vision", "objectives", "fields_of_work", "featured_publications", "contact"];

export default function HomeAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const SECTION_LABELS = {
    hero: tr("البطل", "Hero"),
    about: tr("عن المركز", "About"),
    mission: tr("الرسالة", "Mission"),
    vision: tr("الرؤية", "Vision"),
    objectives: tr("الأهداف", "Objectives"),
    fields_of_work: tr("مجالات العمل", "Fields of work"),
    featured_publications: tr("الإصدارات المميزة", "Featured publications"),
    contact: tr("التواصل", "Contact"),
  };
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const form = useDirtyForm({});

  useEffect(() => {
    apiCall("get", "/admin/home").then((r) => { if (r.ok) form.commit(r.data || {}); setLoaded(true); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const r = await apiCall("patch", "/admin/home", form.value);
    setSaving(false);
    if (r.ok) { form.commit(r.data); invalidateSiteCache("home"); setMsg(tr("تم الحفظ ✓ — حدّث الموقع العام لرؤية التغييرات.", "Saved ✓ — refresh public site to see updates.")); setTimeout(() => setMsg(""), 3500); }
    else setMsg(`${tr("خطأ", "Error")}: ${r.error}`);
  }

  const toggleSection = (s) => {
    const list = form.value.visible_sections || [];
    form.patch("visible_sections", list.includes(s) ? list.filter((x) => x !== s) : [...list, s]);
  };

  if (!loaded) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;
  // visible_sections doubles as both ORDER and visibility — order matters in
  // the array, sections not present are hidden.
  const visible = form.value.visible_sections || [];
  const hidden = SECTIONS.filter((s) => !visible.includes(s));
  const moveSection = (from, to) => form.patch("visible_sections", moveItem(visible, from, to));
  const showSection = (s) => form.patch("visible_sections", [...visible, s]);
  const hideSection = (s) => form.patch("visible_sections", visible.filter((x) => x !== s));

  // Objectives reorder
  const objectives = form.value.objectives || [];
  const moveObjective = (from, to) => form.patch("objectives", moveItem(objectives, from, to));

  return (
    <AdminPage
      title={tr("محتوى الصفحة الرئيسية", "Home Page Content")}
      subtitle={tr("الصفحة الرئيسية العامة", "Public homepage")}
      helpAr={"أكتب وأظهِر/أخفِ ورتّب أقسام الصفحة الرئيسية للزائر. «إظهار الأقسام» يحدد ترتيب الأقسام كما تظهر، والأقسام المخفية لن تُعرض إطلاقاً."}
      helpEn={"Edit, show/hide, and reorder home page sections. \"Section visibility\" controls both the order and which sections render publicly. Hidden sections do not render at all."}
    >
      <h3 className="lz-h3">{tr("إظهار وترتيب الأقسام", "Section order & visibility")}</h3>
      <p className="text-[13px] text-mute mt-2 max-w-[60ch]">
        {tr("الأقسام تظهر للزائر بنفس الترتيب أدناه. اسحب أو استخدم الأسهم لإعادة الترتيب، واضغط «إخفاء» لاستبعاد قسم تماماً.",
            "Sections appear publicly in the order shown below. Use the arrows to reorder, or click Hide to exclude a section entirely.")}
      </p>
      <div className="mt-5 max-w-[640px] bg-white border border-rule" data-testid="home-sections-order">
        <ul className="divide-y divide-rule">
          {visible.map((s, idx) => (
            <li key={s} className="flex items-center gap-3 px-5 py-2.5" data-testid={`section-order-row-${s}`}>
              <span className="text-[12px] text-mute tabular-nums w-6">{idx + 1}</span>
              <span className="flex-1 text-[14px] text-navy-deep">{SECTION_LABELS[s]}</span>
              <ReorderControls index={idx} total={visible.length} onMove={moveSection} testid={`section-order-${s}`} />
              <button type="button" onClick={() => hideSection(s)}
                className="text-[12px] text-mute hover:text-red-700 ms-2"
                data-testid={`section-hide-${s}`}>
                {tr("إخفاء", "Hide")}
              </button>
            </li>
          ))}
        </ul>
        {hidden.length > 0 && (
          <div className="border-t border-rule px-5 py-3 bg-paper">
            <div className="text-[11.5px] uppercase tracking-[0.16em] text-mute mb-2">{tr("مخفية", "Hidden")}</div>
            <div className="flex flex-wrap gap-2">
              {hidden.map((s) => (
                <button key={s} type="button" onClick={() => showSection(s)}
                  className="text-[12.5px] px-3 py-1 border border-rule hover:border-navy bg-white"
                  data-testid={`section-show-${s}`}>
                  + {SECTION_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <h3 className="lz-h3 mt-10">{tr("قسم البطل (Hero)", "Hero")}</h3>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        <Field label={tr("سطر فوقي — عربية", "Eyebrow AR")}><TextInput value={form.value.hero_eyebrow_ar} onChange={(v) => form.patch("hero_eyebrow_ar", v)} dir="rtl" testid="hero-eyebrow-ar" /></Field>
        <Field label={tr("سطر فوقي — إنجليزية", "Eyebrow EN")}><TextInput value={form.value.hero_eyebrow_en} onChange={(v) => form.patch("hero_eyebrow_en", v)} testid="hero-eyebrow-en" /></Field>
        <Field label={tr("العنوان — عربية (استخدم \\n لفاصل سطر)", "Title AR (use \\n for line break)")}><TextArea value={form.value.hero_title_ar} onChange={(v) => form.patch("hero_title_ar", v)} dir="rtl" rows={2} testid="hero-title-ar" /></Field>
        <Field label={tr("العنوان — إنجليزية", "Title EN")}><TextArea value={form.value.hero_title_en} onChange={(v) => form.patch("hero_title_en", v)} rows={2} testid="hero-title-en" /></Field>
        <Field label={tr("العنوان الفرعي — عربية", "Subtitle AR")}><TextArea value={form.value.hero_subtitle_ar} onChange={(v) => form.patch("hero_subtitle_ar", v)} dir="rtl" rows={3} testid="hero-subtitle-ar" /></Field>
        <Field label={tr("العنوان الفرعي — إنجليزية", "Subtitle EN")}><TextArea value={form.value.hero_subtitle_en} onChange={(v) => form.patch("hero_subtitle_en", v)} rows={3} testid="hero-subtitle-en" /></Field>
        <Field label={tr("زرار رئيسي — عربية", "CTA primary AR")}><TextInput value={form.value.hero_cta_primary_ar} onChange={(v) => form.patch("hero_cta_primary_ar", v)} dir="rtl" testid="cta1-ar" /></Field>
        <Field label={tr("زرار رئيسي — إنجليزية", "CTA primary EN")}><TextInput value={form.value.hero_cta_primary_en} onChange={(v) => form.patch("hero_cta_primary_en", v)} testid="cta1-en" /></Field>
        <Field label={tr("زرار ثانوي — عربية", "CTA secondary AR")}><TextInput value={form.value.hero_cta_secondary_ar} onChange={(v) => form.patch("hero_cta_secondary_ar", v)} dir="rtl" testid="cta2-ar" /></Field>
        <Field label={tr("زرار ثانوي — إنجليزية", "CTA secondary EN")}><TextInput value={form.value.hero_cta_secondary_en} onChange={(v) => form.patch("hero_cta_secondary_en", v)} testid="cta2-en" /></Field>
      </div>

      <h3 className="lz-h3 mt-10">{tr("عن المركز", "About")}</h3>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        <Field label={tr("عن المركز — عربية", "About AR")}><TextArea value={form.value.about_ar} onChange={(v) => form.patch("about_ar", v)} dir="rtl" rows={5} testid="about-ar" /></Field>
        <Field label={tr("عن المركز — إنجليزية", "About EN")}><TextArea value={form.value.about_en} onChange={(v) => form.patch("about_en", v)} rows={5} testid="about-en" /></Field>
        <Field label={tr("تفاصيل إضافية — عربية", "About extended AR")}><TextArea value={form.value.about_extended_ar} onChange={(v) => form.patch("about_extended_ar", v)} dir="rtl" rows={4} /></Field>
        <Field label={tr("تفاصيل إضافية — إنجليزية", "About extended EN")}><TextArea value={form.value.about_extended_en} onChange={(v) => form.patch("about_extended_en", v)} rows={4} /></Field>
      </div>

      <h3 className="lz-h3 mt-10">{tr("الرسالة والرؤية", "Mission & Vision")}</h3>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        <Field label={tr("الرسالة — عربية", "Mission AR")}><TextArea value={form.value.mission_ar} onChange={(v) => form.patch("mission_ar", v)} dir="rtl" rows={3} /></Field>
        <Field label={tr("الرسالة — إنجليزية", "Mission EN")}><TextArea value={form.value.mission_en} onChange={(v) => form.patch("mission_en", v)} rows={3} /></Field>
        <Field label={tr("الرؤية — عربية", "Vision AR")}><TextArea value={form.value.vision_ar} onChange={(v) => form.patch("vision_ar", v)} dir="rtl" rows={3} /></Field>
        <Field label={tr("الرؤية — إنجليزية", "Vision EN")}><TextArea value={form.value.vision_en} onChange={(v) => form.patch("vision_en", v)} rows={3} /></Field>
      </div>

      {objectives.length > 0 && (
        <>
          <h3 className="lz-h3 mt-10">{tr("ترتيب الأهداف", "Objectives order")}</h3>
          <p className="text-[13px] text-mute mt-2 max-w-[60ch]">
            {tr("رتّب الأهداف كما تظهر للزائر في قسم الأهداف. لتعديل النص، استخدم API الإصدارات أو الطلبات (يُتاح التعديل المُفصَّل في مرحلة لاحقة).",
                "Reorder the objectives as they appear in the public Objectives section. Detailed text editing UI will arrive in a later phase.")}
          </p>
          <div className="mt-5 max-w-[760px] bg-white border border-rule" data-testid="home-objectives-order">
            <ul className="divide-y divide-rule">
              {objectives.map((obj, idx) => (
                <li key={obj.id || idx} className="flex items-center gap-3 px-5 py-2.5" data-testid={`objective-row-${idx}`}>
                  <span className="text-[12px] text-mute tabular-nums w-6">{idx + 1}</span>
                  <span className="flex-1 text-[14px] text-navy-deep">{obj.title_ar || obj.title_en || obj.id}</span>
                  <ReorderControls index={idx} total={objectives.length} onMove={moveObjective} testid={`objective-reorder-${idx}`} />
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
    </AdminPage>
  );
}

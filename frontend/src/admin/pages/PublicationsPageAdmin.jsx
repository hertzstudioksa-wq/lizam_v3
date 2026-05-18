import { useEffect, useState } from "react";
import {
  AdminPage, Field, TextInput, SaveBar, useDirtyForm, apiCall, Toggle,
} from "@/admin/components/AdminUI";
import {
  SectionCard, BgImageBlock, BgColorControl, GradientAccentControl,
  EyebrowRow, BiInput, moveItem,
} from "@/admin/components/sectionControls";
import { useLang } from "@/i18n/LanguageContext";
import { invalidateSiteCache } from "@/hooks/useSiteSettings";

const SECTIONS = ["hero", "authors_section", "results"];

const SECTION_LABELS_AR = { hero: "البطل (Hero)", authors_section: "قسم الباحثين", results: "شبكة الإصدارات" };
const SECTION_LABELS_EN = { hero: "Hero", authors_section: "Authors Carousel", results: "Publications Grid" };

const DEFAULTS = {
  hero_eyebrow_ar: "مكتبة المركز",      hero_eyebrow_en: "Library",
  hero_title_ar: "الإصدارات البحثية",   hero_title_en: "Research Publications",
  hero_subtitle_ar: "",                  hero_subtitle_en: "",
  search_placeholder_ar: "ابحث في الإصدارات…", search_placeholder_en: "Search publications…",
  count_suffix_ar: "إصدار منشور",        count_suffix_en: "published items",
  all_fields_label_ar: "كل المجالات",   all_fields_label_en: "All fields",
  clear_filters_ar: "مسح الفلاتر",      clear_filters_en: "Reset filters",
  empty_eyebrow_ar: "لا توجد نتائج",    empty_eyebrow_en: "No results",
  empty_title_ar: "لم نعثر على إصدارات تطابق المعايير.",
  empty_title_en: "No publications match the current filters.",
  empty_reset_ar: "إعادة تعيين الفلاتر", empty_reset_en: "Reset filters",
  authors_section_visible: true,
  // Default section order: filters always at top, authors then results
  authors_heading_ar: "باحثو المركز", authors_heading_en: "Our Researchers",
  authors_subheading_ar: "يُعلي باحثو مركز لزام من قيمة البحث القانوني، خدمةً للمملكة العربية السعودية وإسهاماً في بناء منظومة تشريعية راسخة.",
  authors_subheading_en: "LIZAM researchers elevate the value of legal scholarship, serving Saudi Arabia and contributing to a principled legislative foundation.",
};

export default function PublicationsPageAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const form = useDirtyForm({});

  useEffect(() => {
    apiCall("get", "/admin/publications-page").then((r) => {
      if (r.ok) form.commit({ ...DEFAULTS, ...(r.data || {}) });
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const r = await apiCall("patch", "/admin/publications-page", form.value);
    setSaving(false);
    if (r.ok) {
      form.commit(r.data);
      invalidateSiteCache("publications");
      setMsg(tr("تم الحفظ ✓ — صفحة /publications حُدِّثت فوراً.", "Saved ✓ — /publications updated."));
      setTimeout(() => setMsg(""), 3500);
    } else setMsg(`${tr("خطأ", "Error")}: ${r.error}`);
  }

  if (!loaded) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  const visible = form.value.visible_sections || SECTIONS;
  const toggleVisibility = (id) => {
    const next = visible.includes(id) ? visible.filter((s) => s !== id) : [...visible, id];
    form.patch("visible_sections", next);
  };
  const hidden = SECTIONS.filter((s) => !visible.includes(s));
  const sectionLabel = (k) => (lang === "ar" ? SECTION_LABELS_AR[k] : SECTION_LABELS_EN[k]) || k;
  const moveSection = (from, to) => form.patch("visible_sections", moveItem(visible, from, to));
  const orderInfo = (id) => ({
    orderIndex: visible.indexOf(id) >= 0 ? visible.indexOf(id) : undefined,
    orderTotal: visible.length,
  });

  return (
    <AdminPage
      title={tr("محتوى صفحة الإصدارات", "Publications Page Content")}
      subtitle={tr("تحكم في Hero ونصوص الصفحة — الإصدارات نفسها تُدار من قسم الإصدارات", "Control the hero and page copy — individual publications are managed in the Publications section")}
      helpAr="هذه الصفحة للتحكم في محتوى صفحة /publications: العنوان، الوصف، الصورة الخلفية، ونصوص الفلاتر. لإضافة أو تعديل إصدار، استخدم قسم الإصدارات."
      helpEn="This page controls the /publications page layout: title, description, hero image, and filter labels. To add or edit individual publications, use the Publications section."
    >
      <div className="max-w-[1180px] flex flex-col gap-6">

        {/* Hidden sections */}
        {hidden.length > 0 && (
          <div className="border border-rule bg-paper px-5 py-4">
            <div className="text-[11.5px] uppercase tracking-[0.18em] text-mute mb-2">{tr("أقسام مخفية", "Hidden sections")}</div>
            <div className="flex flex-wrap gap-2">
              {hidden.map((k) => (
                <button key={k} type="button" onClick={() => toggleVisibility(k)}
                  className="text-[12px] px-3 py-1 border border-rule bg-white hover:border-brass hover:text-navy-deep">
                  + {sectionLabel(k)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─────────── 1. AUTHORS SECTION ─────────── */}
        <SectionCard id="authors_section" title={tr("قسم الباحثين", "Authors Section")}
          eyebrow={tr("١", "1")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("authors_section")} onMove={moveSection}>

          <div className="mt-4">
            <Toggle
              checked={form.value.authors_section_visible !== false}
              onChange={(v) => form.patch("authors_section_visible", v)}
              label={tr("إظهار القسم في صفحة الإصدارات", "Show section on publications page")}
              testid="authors-section-visible"
            />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="authors_heading_ar" keyEn="authors_heading_en"
              labelAr="العنوان الصغير (eyebrow)" labelEn="Small heading (eyebrow)"
              testid="authors-heading" sectionKey="authors_section" fieldKey="heading" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="authors_subheading_ar" keyEn="authors_subheading_en"
              labelAr="الجملة الوصفية تحت العنوان" labelEn="Descriptive subtitle"
              multiline rows={3}
              testid="authors-subheading" sectionKey="authors_section" fieldKey="subheading" />
          </div>
          <p className="mt-3 text-[12px] text-mute">
            {tr("بيانات الباحثين تُدار من قسم الباحثين في الداشبورد.", "Author profiles are managed in the Researchers section.")}
          </p>
        </SectionCard>

        {/* ─────────── 2. HERO ─────────── */}
        <SectionCard id="hero" title={tr("قسم البطل (Hero)", "Hero")}
          eyebrow={tr("٢", "2")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("hero")} onMove={moveSection}>

          <div className="mt-4">
            <EyebrowRow form={form} keyAr="hero_eyebrow_ar" keyEn="hero_eyebrow_en"
              sectionKey="hero" testid="pubpage-hero-eyebrow" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="hero_title_ar" keyEn="hero_title_en"
              labelAr="العنوان الرئيسي" labelEn="Main title"
              testid="pubpage-hero-title" sectionKey="hero" fieldKey="title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="hero_subtitle_ar" keyEn="hero_subtitle_en"
              labelAr="وصف تحت العنوان (اختياري)" labelEn="Subtitle (optional)" multiline rows={2}
              testid="pubpage-hero-subtitle" sectionKey="hero" fieldKey="subtitle" />
          </div>
          <div className="mt-5">
            <BgImageBlock form={form} sectionKey="hero" defaultOverlay={0.62}
              label={tr("صورة خلفية البطل", "Hero background image")} />
          </div>
          <BgColorControl form={form} sectionKey="hero" labelAr="لون خلفية القسم" labelEn="Section background color" />
          <GradientAccentControl form={form} sectionKey="hero" />
        </SectionCard>

        {/* ─────────── 3. RESULTS ─────────── */}
        <SectionCard id="results" title={tr("شبكة الإصدارات", "Publications Grid")}
          eyebrow={tr("٣", "3")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("results")} onMove={moveSection}>

          <p className="mt-3 mb-5 text-[12.5px] text-mute">
            {tr("شبكة الإصدارات. شريط الفلاتر ثابت دايماً في الأعلى. حرّك هذا القسم للأعلى أو الأسفل بالنسبة لقسم الباحثين.", "Publications grid. Filters bar is always fixed at top. Move this section above or below the Authors carousel.")}
          </p>

          <h4 className="mb-3 text-[12px] uppercase tracking-[0.16em] text-brass">{tr("نصوص الفلاتر", "Filter Labels")}</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Field label={tr("مسمى عداد الإصدارات — عربية", "Count suffix — AR")}>
              <TextInput value={form.value.count_suffix_ar || ""} onChange={(v) => form.patch("count_suffix_ar", v)} dir="rtl" placeholder="إصدار منشور" testid="pubpage-count-ar" />
            </Field>
            <Field label={tr("مسمى عداد الإصدارات — إنجليزية", "Count suffix — EN")}>
              <TextInput value={form.value.count_suffix_en || ""} onChange={(v) => form.patch("count_suffix_en", v)} placeholder="published items" testid="pubpage-count-en" />
            </Field>
            <Field label={tr("نص البحث — عربية", "Search placeholder — AR")}>
              <TextInput value={form.value.search_placeholder_ar || ""} onChange={(v) => form.patch("search_placeholder_ar", v)} dir="rtl" placeholder="ابحث في الإصدارات…" testid="pubpage-search-ar" />
            </Field>
            <Field label={tr("نص البحث — إنجليزية", "Search placeholder — EN")}>
              <TextInput value={form.value.search_placeholder_en || ""} onChange={(v) => form.patch("search_placeholder_en", v)} placeholder="Search publications…" testid="pubpage-search-en" />
            </Field>
            <Field label={tr("تسمية كل المجالات — عربية", "All fields — AR")}>
              <TextInput value={form.value.all_fields_label_ar || ""} onChange={(v) => form.patch("all_fields_label_ar", v)} dir="rtl" placeholder="كل المجالات" testid="pubpage-allfields-ar" />
            </Field>
            <Field label={tr("تسمية كل المجالات — إنجليزية", "All fields — EN")}>
              <TextInput value={form.value.all_fields_label_en || ""} onChange={(v) => form.patch("all_fields_label_en", v)} placeholder="All fields" testid="pubpage-allfields-en" />
            </Field>
          </div>

          <h4 className="mb-3 text-[12px] uppercase tracking-[0.16em] text-brass">{tr("حالة الفراغ", "Empty state")}</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label={tr("العنوان الصغير — عربية", "Eyebrow — AR")}>
              <TextInput value={form.value.empty_eyebrow_ar || ""} onChange={(v) => form.patch("empty_eyebrow_ar", v)} dir="rtl" placeholder="لا توجد نتائج" testid="pubpage-empty-eyebrow-ar" />
            </Field>
            <Field label={tr("العنوان الصغير — إنجليزية", "Eyebrow — EN")}>
              <TextInput value={form.value.empty_eyebrow_en || ""} onChange={(v) => form.patch("empty_eyebrow_en", v)} placeholder="No results" testid="pubpage-empty-eyebrow-en" />
            </Field>
            <Field label={tr("النص الرئيسي — عربية", "Main text — AR")}>
              <TextInput value={form.value.empty_title_ar || ""} onChange={(v) => form.patch("empty_title_ar", v)} dir="rtl" placeholder="لم نعثر على إصدارات تطابق المعايير." testid="pubpage-empty-title-ar" />
            </Field>
            <Field label={tr("النص الرئيسي — إنجليزية", "Main text — EN")}>
              <TextInput value={form.value.empty_title_en || ""} onChange={(v) => form.patch("empty_title_en", v)} placeholder="No publications match the current filters." testid="pubpage-empty-title-en" />
            </Field>
          </div>

        </SectionCard>

      </div>


      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
    </AdminPage>
  );
}

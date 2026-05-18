import { useEffect, useState } from "react";
import {
  AdminPage, Field, SaveBar, useDirtyForm, apiCall,
} from "@/admin/components/AdminUI";
import {
  SectionCard, BgImageBlock, BgColorControl, GradientAccentControl,
  EyebrowRow, BiInput, moveItem,
} from "@/admin/components/sectionControls";
import { useLang } from "@/i18n/LanguageContext";
import { invalidateSiteCache } from "@/hooks/useSiteSettings";

const SECTIONS = ["hero", "intro", "news"];

const SECTION_LABELS_AR = { hero: "البطل (Hero)", intro: "المقدمة", news: "الأخبار والفعاليات" };
const SECTION_LABELS_EN = { hero: "Hero", intro: "Introduction", news: "News & Events" };

export default function ActivitiesPageAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const form = useDirtyForm({});

  const DEFAULTS = {
    hero_eyebrow_ar: "أخبار المركز", hero_eyebrow_en: "Center News",
    hero_title_ar: "الأنشطة والفعاليات", hero_title_en: "Activities & Events",
    hero_subtitle_ar: "آخر أنشطة مركز لزام للدراسات القانونية وفعالياته البحثية والأكاديمية.",
    hero_subtitle_en: "Latest activities and research events from LIZAM Center for Legal Studies.",
    intro_eyebrow_ar: "نبذة", intro_eyebrow_en: "Overview",
    intro_title_ar: "ما نقوم به", intro_title_en: "What We Do",
    intro_body_ar: "يحرص مركز لزام على إقامة الفعاليات البحثية والندوات الأكاديمية.",
    intro_body_en: "LIZAM Center organizes research events and academic seminars.",
    news_eyebrow_ar: "آخر الأخبار", news_eyebrow_en: "Latest News",
    news_title_ar: "أحدث الفعاليات والأنشطة", news_title_en: "Recent Activities",
    news_body_ar: "تابعونا لمعرفة آخر فعاليات المركز وأنشطته البحثية.",
    news_body_en: "Stay tuned for our latest events and research activities.",
  };

  useEffect(() => {
    apiCall("get", "/admin/activities-page").then((r) => {
      if (r.ok) form.commit({ ...DEFAULTS, ...(r.data || {}) });
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const r = await apiCall("patch", "/admin/activities-page", form.value);
    setSaving(false);
    if (r.ok) {
      form.commit(r.data);
      invalidateSiteCache("activities");
      setMsg(tr("تم الحفظ ✓ — صفحة /activities حُدِّثت فوراً.", "Saved ✓ — /activities updated."));
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
      title={tr("محتوى صفحة الأنشطة", "Activities Page Content")}
      subtitle={tr("أخبار المركز وفعالياته البحثية", "Center news and research events")}
      helpAr="تحكم في نصوص صفحة الأنشطة: قسم البطل، المقدمة، وقسم الأخبار. الصفحة العامة: /activities"
      helpEn="Edit all text on the Activities page: hero, intro, and news section. Public page: /activities."
    >
      <div className="max-w-[1180px] flex flex-col gap-6">

        {/* Hidden sections panel */}
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

        {/* 1. HERO */}
        <SectionCard id="hero" title={tr("قسم البطل (Hero)", "Hero")}
          eyebrow={tr("١", "1")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("hero")} onMove={moveSection}>
          <div className="mt-4">
            <EyebrowRow form={form} keyAr="hero_eyebrow_ar" keyEn="hero_eyebrow_en"
              sectionKey="hero" testid="activities-hero" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="hero_title_ar" keyEn="hero_title_en"
              labelAr="العنوان الرئيسي" labelEn="Main title" multiline={false}
              testid="activities-hero-title" sectionKey="hero" fieldKey="title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="hero_subtitle_ar" keyEn="hero_subtitle_en"
              labelAr="النص الفرعي" labelEn="Subtitle" multiline rows={3}
              testid="activities-hero-sub" sectionKey="hero" fieldKey="subtitle" />
          </div>
          <div className="mt-5">
            <BgImageBlock form={form} sectionKey="hero" defaultOverlay={0.62}
              label={tr("صورة خلفية البطل", "Hero background image")} />
          </div>
          <BgColorControl form={form} sectionKey="hero" />
          <GradientAccentControl form={form} sectionKey="hero" />
        </SectionCard>

        {/* 2. INTRO */}
        <SectionCard id="intro" title={tr("المقدمة", "Introduction")}
          eyebrow={tr("٢", "2")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("intro")} onMove={moveSection}>
          <div className="mt-4">
            <EyebrowRow form={form} keyAr="intro_eyebrow_ar" keyEn="intro_eyebrow_en"
              sectionKey="intro" testid="activities-intro" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="intro_title_ar" keyEn="intro_title_en"
              labelAr="العنوان" labelEn="Title" multiline={false}
              testid="activities-intro-title" sectionKey="intro" fieldKey="title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="intro_body_ar" keyEn="intro_body_en"
              labelAr="النص" labelEn="Body text" multiline rows={4}
              testid="activities-intro-body" sectionKey="intro" fieldKey="body" />
          </div>
          <BgColorControl form={form} sectionKey="intro" />
        </SectionCard>

        {/* 3. NEWS */}
        <SectionCard id="news" title={tr("الأخبار والفعاليات", "News & Events")}
          eyebrow={tr("٣", "3")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("news")} onMove={moveSection}>
          <div className="mt-4">
            <EyebrowRow form={form} keyAr="news_eyebrow_ar" keyEn="news_eyebrow_en"
              sectionKey="news" testid="activities-news" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="news_title_ar" keyEn="news_title_en"
              labelAr="عنوان القسم" labelEn="Section title" multiline={false}
              testid="activities-news-title" sectionKey="news" fieldKey="title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="news_body_ar" keyEn="news_body_en"
              labelAr="النص" labelEn="Body text" multiline rows={4}
              testid="activities-news-body" sectionKey="news" fieldKey="body" />
          </div>
          <BgColorControl form={form} sectionKey="news" />
        </SectionCard>

      </div>

      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
    </AdminPage>
  );
}

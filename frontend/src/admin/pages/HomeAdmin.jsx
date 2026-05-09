import { useEffect, useState } from "react";
import { AdminPage, Field, TextArea, SaveBar, useDirtyForm, apiCall, TextInput } from "@/admin/components/AdminUI";
import { ReorderControls, moveItem } from "@/admin/components/ReorderControls";
import { useLang } from "@/i18n/LanguageContext";
import { invalidateSiteCache } from "@/hooks/useSiteSettings";

const SECTIONS = ["hero", "about", "mission", "vision", "objectives", "fields_of_work", "featured_publications", "contact"];

/* Eyebrows admins can edit. The component derives default labels from the
 * current language; the text saved here overrides the hardcoded fallback. */
const EYEBROW_FIELDS = [
  { key: "hero",        labelAr: "البطل (Hero)",          labelEn: "Hero" },
  { key: "about",       labelAr: "عن المركز",             labelEn: "About" },
  { key: "mission",     labelAr: "المنطلقات (الرسالة/الرؤية)", labelEn: "Foundations (Mission/Vision)" },
  { key: "objectives",  labelAr: "الأهداف",               labelEn: "Objectives" },
  { key: "fields",      labelAr: "مجالات العمل",          labelEn: "Fields of Work" },
  { key: "featured",    labelAr: "الإصدارات المميزة",     labelEn: "Featured Publications" },
  { key: "contact",     labelAr: "تواصل",                 labelEn: "Contact" },
];

/* Helpers — convert array <-> textarea (one item per non-empty line). */
const arrToText = (arr) => (Array.isArray(arr) ? arr.filter(Boolean).join("\n") : "");
const textToArr = (txt) =>
  String(txt || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

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
    apiCall("get", "/admin/home").then((r) => {
      if (r.ok) form.commit(r.data || {});
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const r = await apiCall("patch", "/admin/home", form.value);
    setSaving(false);
    if (r.ok) {
      form.commit(r.data);
      invalidateSiteCache("home");
      setMsg(tr("تم الحفظ ✓ — التغييرات بدأت تظهر فوراً على الموقع العام.", "Saved ✓ — public site updated."));
      setTimeout(() => setMsg(""), 3500);
    } else setMsg(`${tr("خطأ", "Error")}: ${r.error}`);
  }

  if (!loaded) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  // Section visibility & order — single array doubles as both
  const visible = form.value.visible_sections || [];
  const hidden = SECTIONS.filter((s) => !visible.includes(s));
  const moveSection = (from, to) => form.patch("visible_sections", moveItem(visible, from, to));
  const showSection = (s) => form.patch("visible_sections", [...visible, s]);
  const hideSection = (s) => form.patch("visible_sections", visible.filter((x) => x !== s));

  // Objectives — full inline editing + reorder
  const objectives = form.value.objectives || [];
  const moveObjective = (from, to) => form.patch("objectives", moveItem(objectives, from, to));
  const updateObjective = (idx, patch) => {
    const next = objectives.map((o, i) => (i === idx ? { ...o, ...patch } : o));
    form.patch("objectives", next);
  };

  return (
    <AdminPage
      title={tr("محتوى الصفحة الرئيسية", "Home Page Content")}
      subtitle={tr("الصفحة الرئيسية العامة", "Public homepage")}
      helpAr={"حرّر النصوص، رتّب الأقسام، أظهرها أو أخفِها، وعدّل عناوين الأقسام (eyebrows). كل تعديل يُحدّث الموقع العام فور الحفظ."}
      helpEn={"Edit copy, reorder/show/hide sections, and customise the small section labels (eyebrows). Every save reflects publicly within seconds."}
    >
      {/* ---------------- Section order & visibility ---------------- */}
      <h3 className="lz-h3">{tr("إظهار وترتيب الأقسام", "Section order & visibility")}</h3>
      <p className="text-[13px] text-mute mt-2 max-w-[60ch]">
        {tr(
          "الأقسام تظهر للزائر بنفس الترتيب أدناه. استخدم الأسهم لإعادة الترتيب، واضغط «إخفاء» لاستبعاد قسم تماماً.",
          "Sections appear publicly in this order. Use the arrows to reorder, or click Hide to exclude.",
        )}
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

      {/* ---------------- Eyebrow labels (kicker text) ---------------- */}
      <h3 className="lz-h3 mt-12">{tr("تسميات أعلى الأقسام (Eyebrows)", "Section eyebrows")}</h3>
      <p className="text-[13px] text-mute mt-2 max-w-[64ch]">
        {tr(
          "النص الصغير الذهبي اللي بيظهر فوق عنوان كل قسم (مثل «عن المركز» و«المنطلقات»). اتركها فارغة لتعود إلى القيمة الافتراضية.",
          'Small gold kicker label above each section heading (e.g. "About", "Foundations"). Leave empty to revert to the built-in default.',
        )}
      </p>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-[1100px]">
        {EYEBROW_FIELDS.map((f) => (
          <div key={f.key} className="grid grid-cols-2 gap-3">
            <Field label={`${tr(f.labelAr, f.labelEn)} — ${tr("عربية", "AR")}`}>
              <TextInput
                value={form.value[`${f.key}_eyebrow_ar`] || ""}
                onChange={(v) => form.patch(`${f.key}_eyebrow_ar`, v)}
                dir="rtl"
                testid={`eyebrow-${f.key}-ar`}
              />
            </Field>
            <Field label={`${tr(f.labelAr, f.labelEn)} — EN`}>
              <TextInput
                value={form.value[`${f.key}_eyebrow_en`] || ""}
                onChange={(v) => form.patch(`${f.key}_eyebrow_en`, v)}
                testid={`eyebrow-${f.key}-en`}
              />
            </Field>
          </div>
        ))}
      </div>

      {/* ---------------- Hero ---------------- */}
      <h3 className="lz-h3 mt-12">{tr("قسم البطل (Hero)", "Hero")}</h3>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        <Field label={tr("العنوان — عربية (استخدم \\n لفاصل سطر)", "Title AR (use \\n for line break)")}>
          <TextArea value={form.value.hero_title_ar} onChange={(v) => form.patch("hero_title_ar", v)} dir="rtl" rows={2} testid="hero-title-ar" />
        </Field>
        <Field label={tr("العنوان — إنجليزية", "Title EN")}>
          <TextArea value={form.value.hero_title_en} onChange={(v) => form.patch("hero_title_en", v)} rows={2} testid="hero-title-en" />
        </Field>
        <Field label={tr("العنوان الفرعي — عربية", "Subtitle AR")}>
          <TextArea value={form.value.hero_subtitle_ar} onChange={(v) => form.patch("hero_subtitle_ar", v)} dir="rtl" rows={3} testid="hero-subtitle-ar" />
        </Field>
        <Field label={tr("العنوان الفرعي — إنجليزية", "Subtitle EN")}>
          <TextArea value={form.value.hero_subtitle_en} onChange={(v) => form.patch("hero_subtitle_en", v)} rows={3} testid="hero-subtitle-en" />
        </Field>
        <Field label={tr("زرار رئيسي — عربية", "CTA primary AR")}>
          <TextInput value={form.value.hero_cta_primary_ar} onChange={(v) => form.patch("hero_cta_primary_ar", v)} dir="rtl" testid="cta1-ar" />
        </Field>
        <Field label={tr("زرار رئيسي — إنجليزية", "CTA primary EN")}>
          <TextInput value={form.value.hero_cta_primary_en} onChange={(v) => form.patch("hero_cta_primary_en", v)} testid="cta1-en" />
        </Field>
        <Field label={tr("زرار ثانوي — عربية", "CTA secondary AR")}>
          <TextInput value={form.value.hero_cta_secondary_ar} onChange={(v) => form.patch("hero_cta_secondary_ar", v)} dir="rtl" testid="cta2-ar" />
        </Field>
        <Field label={tr("زرار ثانوي — إنجليزية", "CTA secondary EN")}>
          <TextInput value={form.value.hero_cta_secondary_en} onChange={(v) => form.patch("hero_cta_secondary_en", v)} testid="cta2-en" />
        </Field>
      </div>

      {/* ---------------- About ---------------- */}
      <h3 className="lz-h3 mt-12">{tr("عن المركز", "About")}</h3>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        <Field label={tr("عن المركز — عربية", "About AR")}>
          <TextArea value={form.value.about_ar} onChange={(v) => form.patch("about_ar", v)} dir="rtl" rows={5} testid="about-ar" />
        </Field>
        <Field label={tr("عن المركز — إنجليزية", "About EN")}>
          <TextArea value={form.value.about_en} onChange={(v) => form.patch("about_en", v)} rows={5} testid="about-en" />
        </Field>
        <Field label={tr("تفاصيل إضافية — عربية", "About extended AR")}>
          <TextArea value={form.value.about_extended_ar} onChange={(v) => form.patch("about_extended_ar", v)} dir="rtl" rows={4} />
        </Field>
        <Field label={tr("تفاصيل إضافية — إنجليزية", "About extended EN")}>
          <TextArea value={form.value.about_extended_en} onChange={(v) => form.patch("about_extended_en", v)} rows={4} />
        </Field>
      </div>

      {/* ---------------- Mission & Vision ---------------- */}
      <h3 className="lz-h3 mt-12">{tr("الرسالة والرؤية", "Mission & Vision")}</h3>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">
        <Field label={tr("الرسالة — عربية", "Mission AR")}>
          <TextArea value={form.value.mission_ar} onChange={(v) => form.patch("mission_ar", v)} dir="rtl" rows={4} />
        </Field>
        <Field label={tr("الرسالة — إنجليزية", "Mission EN")}>
          <TextArea value={form.value.mission_en} onChange={(v) => form.patch("mission_en", v)} rows={4} />
        </Field>
        <Field label={tr("نقاط الرسالة — عربية (نقطة في كل سطر)", "Mission points AR (one per line)")}>
          <TextArea
            value={arrToText(form.value.mission_points_ar)}
            onChange={(v) => form.patch("mission_points_ar", textToArr(v))}
            dir="rtl"
            rows={5}
            testid="mission-points-ar"
          />
        </Field>
        <Field label={tr("نقاط الرسالة — إنجليزية (نقطة في كل سطر)", "Mission points EN (one per line)")}>
          <TextArea
            value={arrToText(form.value.mission_points_en)}
            onChange={(v) => form.patch("mission_points_en", textToArr(v))}
            rows={5}
            testid="mission-points-en"
          />
        </Field>
        <Field label={tr("الرؤية — عربية", "Vision AR")}>
          <TextArea value={form.value.vision_ar} onChange={(v) => form.patch("vision_ar", v)} dir="rtl" rows={4} />
        </Field>
        <Field label={tr("الرؤية — إنجليزية", "Vision EN")}>
          <TextArea value={form.value.vision_en} onChange={(v) => form.patch("vision_en", v)} rows={4} />
        </Field>
        <Field label={tr("نقاط الرؤية — عربية (نقطة في كل سطر)", "Vision points AR (one per line)")}>
          <TextArea
            value={arrToText(form.value.vision_points_ar)}
            onChange={(v) => form.patch("vision_points_ar", textToArr(v))}
            dir="rtl"
            rows={5}
            testid="vision-points-ar"
          />
        </Field>
        <Field label={tr("نقاط الرؤية — إنجليزية (نقطة في كل سطر)", "Vision points EN (one per line)")}>
          <TextArea
            value={arrToText(form.value.vision_points_en)}
            onChange={(v) => form.patch("vision_points_en", textToArr(v))}
            rows={5}
            testid="vision-points-en"
          />
        </Field>
      </div>

      {/* ---------------- Objectives — full editor ---------------- */}
      {objectives.length > 0 && (
        <>
          <h3 className="lz-h3 mt-12">{tr("الأهداف", "Objectives")}</h3>
          <p className="text-[13px] text-mute mt-2 max-w-[64ch]">
            {tr(
              "حرّر عنوان كل هدف ووصفه (عربي/إنجليزي)، أو أعد ترتيبهم بالأسهم.",
              "Edit each objective's title and description (AR/EN), or reorder them with the arrows.",
            )}
          </p>
          <div className="mt-5 max-w-[1100px] space-y-4" data-testid="home-objectives-editor">
            {objectives.map((obj, idx) => (
              <div key={obj.id || idx} className="border border-rule bg-white p-5" data-testid={`objective-edit-${idx}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[12px] text-mute tabular-nums w-6">{idx + 1}</span>
                  <span className="text-[13px] text-navy-deep flex-1 truncate">
                    {obj.title_ar || obj.title_en || obj.id}
                  </span>
                  <ReorderControls
                    index={idx}
                    total={objectives.length}
                    onMove={moveObjective}
                    testid={`objective-reorder-${idx}`}
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Field label={tr("العنوان — عربية", "Title AR")}>
                    <TextInput
                      value={obj.title_ar || ""}
                      onChange={(v) => updateObjective(idx, { title_ar: v })}
                      dir="rtl"
                      testid={`objective-${idx}-title-ar`}
                    />
                  </Field>
                  <Field label={tr("العنوان — إنجليزية", "Title EN")}>
                    <TextInput
                      value={obj.title_en || ""}
                      onChange={(v) => updateObjective(idx, { title_en: v })}
                      testid={`objective-${idx}-title-en`}
                    />
                  </Field>
                  <Field label={tr("الوصف — عربية", "Description AR")}>
                    <TextArea
                      value={obj.description_ar || ""}
                      onChange={(v) => updateObjective(idx, { description_ar: v })}
                      dir="rtl"
                      rows={4}
                      testid={`objective-${idx}-desc-ar`}
                    />
                  </Field>
                  <Field label={tr("الوصف — إنجليزية", "Description EN")}>
                    <TextArea
                      value={obj.description_en || ""}
                      onChange={(v) => updateObjective(idx, { description_en: v })}
                      rows={4}
                      testid={`objective-${idx}-desc-en`}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
    </AdminPage>
  );
}

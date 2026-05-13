import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import {
  AdminPage, Field, TextArea, TextInput, SaveBar, useDirtyForm, apiCall,
} from "@/admin/components/AdminUI";
import {
  SectionCard, FontScaleSlider, BgImageBlock, ImageUploader,
  BgColorControl, GradientAccentControl, BiInput, EyebrowRow, BiList,
  FieldTypoControls, AlignToggle,
  arrToText, textToArr, uid, moveItem,
} from "@/admin/components/sectionControls";
import { useLang } from "@/i18n/LanguageContext";
import { invalidateSiteCache } from "@/hooks/useSiteSettings";

const SECTIONS = ["hero", "intro", "mission_vision", "objectives", "stats", "board", "partners", "contact_cta"];

const SECTION_LABELS_AR = {
  hero: "البطل (Hero)",
  intro: "نبذة عن المركز",
  mission_vision: "الرسالة والرؤية",
  objectives: "الأهداف",
  stats: "إحصائيات وأرقام مميزة",
  board: "مجلس الإدارة",
  partners: "شركاء النجاح",
  contact_cta: "دعوة للتواصل",
};
const SECTION_LABELS_EN = {
  hero: "Hero",
  intro: "About intro",
  mission_vision: "Mission & Vision",
  objectives: "Objectives",
  stats: "Stats & KPIs",
  board: "Board of Directors",
  partners: "Success Partners",
  contact_cta: "Contact CTA",
};


/** Tiny reusable item row used by board/partners. Pure presentational. */
function ItemRow({ index, total, onMove, onRemove, children, testid }) {
  const canUp = index > 0;
  const canDown = index < total - 1;
  return (
    <div className="border border-rule bg-white p-4 mb-3" data-testid={testid}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11.5px] uppercase tracking-[0.18em] text-brass">#{String(index + 1).padStart(2, "0")}</span>
        <div className="flex items-center gap-1.5">
          <button type="button" disabled={!canUp}
            onClick={() => onMove(index, index - 1)}
            className="w-7 h-7 border border-rule text-mute hover:text-navy-deep hover:border-brass disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid={`${testid}-up`}>↑</button>
          <button type="button" disabled={!canDown}
            onClick={() => onMove(index, index + 1)}
            className="w-7 h-7 border border-rule text-mute hover:text-navy-deep hover:border-brass disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid={`${testid}-down`}>↓</button>
          <button type="button" onClick={() => onRemove(index)}
            className="w-7 h-7 border border-rule text-red-700 hover:bg-red-50"
            data-testid={`${testid}-remove`}>
            <Trash2 size={12} className="mx-auto" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}


export default function AboutAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const form = useDirtyForm({});

  useEffect(() => {
    apiCall("get", "/admin/about").then((r) => {
      if (r.ok) form.commit(r.data || {});
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const r = await apiCall("patch", "/admin/about", form.value);
    setSaving(false);
    if (r.ok) {
      form.commit(r.data);
      invalidateSiteCache("about");
      setMsg(tr("تم الحفظ ✓ — صفحة /about حُدِّثت فوراً.", "Saved ✓ — /about updated."));
      setTimeout(() => setMsg(""), 3500);
    } else setMsg(`${tr("خطأ", "Error")}: ${r.error}`);
  }

  if (!loaded) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  const visible = form.value.visible_sections || SECTIONS;
  const toggleVisibility = (id) => {
    const next = visible.includes(id) ? visible.filter((s) => s !== id) : [...visible, id];
    form.patch("visible_sections", next);
  };
  const moveSection = (from, to) => form.patch("visible_sections", moveItem(visible, from, to));
  const orderInfo = (id) => ({
    orderIndex: visible.indexOf(id) >= 0 ? visible.indexOf(id) : undefined,
    orderTotal: visible.length,
  });
  const sectionLabel = (k) => (lang === "ar" ? SECTION_LABELS_AR[k] : SECTION_LABELS_EN[k]) || k;
  const hidden = SECTIONS.filter((s) => !visible.includes(s));

  // -------- Objectives list helpers --------
  const objectives = form.value.objectives || [];
  const updateObjective = (i, patch) =>
    form.patch("objectives", objectives.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  const moveObjective = (from, to) => form.patch("objectives", moveItem(objectives, from, to));
  const addObjective = () =>
    form.patch("objectives", [...objectives, { id: uid(), title_ar: "", title_en: "", description_ar: "", description_en: "" }]);
  const removeObjective = (i) => form.patch("objectives", objectives.filter((_, idx) => idx !== i));

  // -------- Board members --------
  const board = form.value.board_members || [];
  const updateMember = (i, patch) =>
    form.patch("board_members", board.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const moveMember = (from, to) => form.patch("board_members", moveItem(board, from, to));
  const addMember = () =>
    form.patch("board_members", [...board, { id: uid(), name_ar: "", name_en: "", role_ar: "", role_en: "", bio_ar: "", bio_en: "", image_url: "", linkedin: "" }]);
  const removeMember = (i) => form.patch("board_members", board.filter((_, idx) => idx !== i));

  // -------- Stats / KPI tiles --------
  const stats = form.value.stats || [];
  const updateStat = (i, patch) =>
    form.patch("stats", stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const moveStat = (from, to) => form.patch("stats", moveItem(stats, from, to));
  const addStat = () =>
    form.patch("stats", [...stats, { id: uid(), value: 0, prefix: "", suffix_ar: "", suffix_en: "", label_ar: "", label_en: "" }]);
  const removeStat = (i) => form.patch("stats", stats.filter((_, idx) => idx !== i));

  // -------- Partners --------
  const partners = form.value.partners || [];
  const updatePartner = (i, patch) =>
    form.patch("partners", partners.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const movePartner = (from, to) => form.patch("partners", moveItem(partners, from, to));
  const addPartner = () =>
    form.patch("partners", [...partners, { id: uid(), name_ar: "", name_en: "", logo_url: "", link: "" }]);
  const removePartner = (i) => form.patch("partners", partners.filter((_, idx) => idx !== i));

  return (
    <AdminPage
      title={tr("محتوى صفحة عن المركز", "About Page Content")}
      subtitle={tr("داش بورد كامل — قسم بقسم", "Full dashboard — section by section")}
      helpAr={"كل قسم في بطاقة منفصلة. اضغط على رأس البطاقة للفتح/الإغلاق. التحكم في الإظهار/الإخفاء، النصوص، حجم الخط، الألوان والصور — كل شيء فورياً على الحفظ. الصفحة العامة: /about"}
      helpEn={"Each section lives in its own collapsible card. Toggle visibility, edit copy, tune typography, pick colors, upload images. Public page: /about."}
    >
      <div className="max-w-[1180px] flex flex-col gap-6">

        {/* Hidden sections quick-reveal panel */}
        {hidden.length > 0 && (
          <div className="border border-rule bg-paper px-5 py-4" data-testid="hidden-sections-panel">
            <div className="text-[11.5px] uppercase tracking-[0.18em] text-mute mb-2">{tr("أقسام مخفية", "Hidden sections")}</div>
            <div className="flex flex-wrap gap-2">
              {hidden.map((k) => (
                <button key={k} type="button" onClick={() => toggleVisibility(k)}
                  className="text-[12px] px-3 py-1 border border-rule bg-white hover:border-brass hover:text-navy-deep"
                  data-testid={`reveal-section-${k}`}>
                  + {sectionLabel(k)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 1. HERO                                                        */}
        {/* ============================================================ */}
        <SectionCard id="hero" title={tr("قسم البطل (Hero)", "Hero")}
          eyebrow={tr("١", "1")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("hero")} onMove={moveSection}>
          <div className="mt-4">
            <EyebrowRow form={form} keyAr="hero_eyebrow_ar" keyEn="hero_eyebrow_en"
              sectionKey="hero" testid="about-hero" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="hero_title_ar" keyEn="hero_title_en"
              labelAr="العنوان الرئيسي" labelEn="Main title" multiline rows={2}
              testid="about-hero-title" sectionKey="hero" fieldKey="title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="hero_subtitle_ar" keyEn="hero_subtitle_en"
              labelAr="النص الفرعي" labelEn="Subtitle" multiline rows={3}
              testid="about-hero-sub" sectionKey="hero" fieldKey="subtitle" />
          </div>
          <h4 className="mt-6 mb-3 text-[12.5px] uppercase tracking-[0.16em] text-mute">{tr("الخلفية وحجم الخط", "Background & typography")}</h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2">
              <BgImageBlock form={form} sectionKey="hero" defaultOverlay={0.62}
                label={tr("صورة خلفية البطل", "Hero background image")} />
            </div>
            <div className="space-y-3">
              <FontScaleSlider form={form} sectionKey="hero"
                labelAr="حجم خط العنوان" labelEn="Title scale"
                sample={tr("عن المركز", "About")} sampleSize={36} />
            </div>
          </div>
          <BgColorControl form={form} sectionKey="hero" labelAr="لون خلفية القسم" labelEn="Section background color" />
          <GradientAccentControl form={form} sectionKey="hero" />
        </SectionCard>

        {/* ============================================================ */}
        {/* 2. INTRO                                                       */}
        {/* ============================================================ */}
        <SectionCard id="intro" title={tr("نبذة عن المركز", "About intro")}
          eyebrow={tr("٢", "2")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("intro")} onMove={moveSection}>
          <div className="mt-4">
            <EyebrowRow form={form} keyAr="intro_eyebrow_ar" keyEn="intro_eyebrow_en"
              sectionKey="intro" testid="about-intro" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="intro_title_ar" keyEn="intro_title_en"
              labelAr="عنوان الفصل" labelEn="Section heading"
              testid="about-intro-title" sectionKey="intro" fieldKey="title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="intro_body_ar" keyEn="intro_body_en"
              labelAr="النص الرئيسي" labelEn="Main copy" multiline rows={5}
              testid="about-intro-body" sectionKey="intro" fieldKey="body" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="intro_body_extended_ar" keyEn="intro_body_extended_en"
              labelAr="تفاصيل إضافية" labelEn="Extended details" multiline rows={4}
              testid="about-intro-ext" sectionKey="intro" fieldKey="extended" />
          </div>
          <div className="mt-5">
            <BgImageBlock form={form} sectionKey="intro" defaultOverlay={0.85}
              label={tr("صورة خلفية القسم (اختيارية)", "Section background (optional)")} />
          </div>
          <BgColorControl form={form} sectionKey="intro" labelAr="لون خلفية القسم" labelEn="Section background color" />
          <GradientAccentControl form={form} sectionKey="intro" />
        </SectionCard>

        {/* ============================================================ */}
        {/* 3. MISSION & VISION                                            */}
        {/* ============================================================ */}
        <SectionCard id="mission_vision" title={tr("الرسالة والرؤية", "Mission & Vision")}
          eyebrow={tr("٣", "3")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("mission_vision")} onMove={moveSection}>

          {/* MISSION GROUP */}
          <h4 className="mt-5 mb-3 text-[12.5px] uppercase tracking-[0.16em] text-brass">{tr("الفصل الأول · الرسالة", "Chapter 01 · Mission")}</h4>

          <div className="mb-3">
            <EyebrowRow form={form} keyAr="mission_eyebrow_ar" keyEn="mission_eyebrow_en"
              sectionKey="mission_vision" testid="mv-mission" fieldKey="mission_eyebrow" />
          </div>
          <div className="mb-3">
            <BiInput form={form} keyAr="mission_title_ar" keyEn="mission_title_en"
              labelAr="العنوان الكبير" labelEn="Headline"
              testid="mv-mission-title" sectionKey="mission_vision" fieldKey="mission_title" perLangAlign />
          </div>
          <div className="mb-3">
            <BiInput form={form} keyAr="mission_body_ar" keyEn="mission_body_en"
              labelAr="نص الرسالة" labelEn="Mission body" multiline rows={4}
              testid="mv-mission-body" sectionKey="mission_vision" fieldKey="mission_body" />
          </div>
          <div className="mb-3">
            <BiList form={form} keyAr="mission_points_ar" keyEn="mission_points_en"
              labelAr="نقاط الرسالة" labelEn="Mission points"
              testid="mv-mission-points" sectionKey="mission_vision" fieldKey="mission_points" />
          </div>

          {/* VISION GROUP */}
          <h4 className="mt-9 mb-3 text-[12.5px] uppercase tracking-[0.16em] text-brass">{tr("الفصل الثاني · الرؤية", "Chapter 02 · Vision")}</h4>

          <div className="mb-3">
            <EyebrowRow form={form} keyAr="vision_eyebrow_ar" keyEn="vision_eyebrow_en"
              sectionKey="mission_vision" testid="mv-vision" fieldKey="vision_eyebrow" />
          </div>
          <div className="mb-3">
            <BiInput form={form} keyAr="vision_title_ar" keyEn="vision_title_en"
              labelAr="العنوان الكبير" labelEn="Headline"
              testid="mv-vision-title" sectionKey="mission_vision" fieldKey="vision_title" perLangAlign />
          </div>
          <div className="mb-3">
            <BiInput form={form} keyAr="vision_body_ar" keyEn="vision_body_en"
              labelAr="نص الرؤية" labelEn="Vision body" multiline rows={4}
              testid="mv-vision-body" sectionKey="mission_vision" fieldKey="vision_body" />
          </div>
          <div className="mb-3">
            <BiList form={form} keyAr="vision_points_ar" keyEn="vision_points_en"
              labelAr="نقاط الرؤية" labelEn="Vision points"
              testid="mv-vision-points" sectionKey="mission_vision" fieldKey="vision_points" />
          </div>

          <div className="mt-5">
            <BgImageBlock form={form} sectionKey="mission_vision" defaultOverlay={0.85}
              label={tr("صورة خلفية القسم (اختيارية)", "Section background (optional)")} />
          </div>
          <BgColorControl form={form} sectionKey="mission_vision" labelAr="لون خلفية القسم" labelEn="Section background color" />
          <GradientAccentControl form={form} sectionKey="mission_vision" />
        </SectionCard>

        {/* ============================================================ */}
        {/* 4. OBJECTIVES                                                  */}
        {/* ============================================================ */}
        <SectionCard id="objectives" title={tr("الأهداف", "Objectives")}
          eyebrow={tr("٤", "4")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("objectives")} onMove={moveSection}>
          <div className="mt-4">
            <EyebrowRow form={form} keyAr="objectives_eyebrow_ar" keyEn="objectives_eyebrow_en"
              sectionKey="objectives" testid="objectives" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="objectives_title_ar" keyEn="objectives_title_en"
              labelAr="العنوان الرئيسي" labelEn="Main heading"
              testid="objectives-title" sectionKey="objectives" fieldKey="title" />
          </div>

          {/* Per-item typography (applies to all cards uniformly) */}
          <div className="mt-5 px-3 py-3 bg-amber-50/40 border border-rule">
            <div className="text-[11px] uppercase tracking-[0.16em] text-brass mb-2">{tr("تنسيق العناصر (يطبّق على الكل)", "Item typography (applies to all)")}</div>
            <div className="text-[10.5px] text-mute mb-1">{tr("عنوان العنصر", "Item title")}</div>
            <FieldTypoControls form={form} sectionKey="objectives" fieldKey="item_title" testid="typo-objectives-item-title" />
            <div className="text-[10.5px] text-mute mb-1">{tr("وصف العنصر", "Item description")}</div>
            <FieldTypoControls form={form} sectionKey="objectives" fieldKey="item_desc" testid="typo-objectives-item-desc" />
          </div>

          <div className="mt-5">
            {(objectives || []).map((o, i) => (
              <ItemRow key={o.id} index={i} total={objectives.length} onMove={moveObjective} onRemove={removeObjective}
                testid={`obj-${i}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Field label={tr("العنوان — عربية", "Title AR")}>
                    <TextInput value={o.title_ar || ""} onChange={(v) => updateObjective(i, { title_ar: v })} dir="rtl" testid={`obj-${i}-title-ar`} />
                  </Field>
                  <Field label={tr("العنوان — إنجليزية", "Title EN")}>
                    <TextInput value={o.title_en || ""} onChange={(v) => updateObjective(i, { title_en: v })} testid={`obj-${i}-title-en`} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                  <Field label={tr("الوصف — عربية", "Description AR")}>
                    <TextArea value={o.description_ar || ""} onChange={(v) => updateObjective(i, { description_ar: v })} dir="rtl" rows={3} testid={`obj-${i}-desc-ar`} />
                  </Field>
                  <Field label={tr("الوصف — إنجليزية", "Description EN")}>
                    <TextArea value={o.description_en || ""} onChange={(v) => updateObjective(i, { description_en: v })} rows={3} testid={`obj-${i}-desc-en`} />
                  </Field>
                </div>
              </ItemRow>
            ))}
            <button type="button" onClick={addObjective}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-navy-deep border border-rule px-3 py-1.5 hover:border-brass hover:text-brass"
              data-testid="add-objective">
              <Plus size={13} /> {tr("إضافة هدف", "Add objective")}
            </button>
          </div>

          <div className="mt-5">
            <BgImageBlock form={form} sectionKey="objectives" defaultOverlay={0.85}
              label={tr("صورة خلفية القسم (اختيارية)", "Section background (optional)")} />
          </div>
          <BgColorControl form={form} sectionKey="objectives" labelAr="لون خلفية القسم" labelEn="Section background color" />
          <GradientAccentControl form={form} sectionKey="objectives" />
        </SectionCard>

        {/* ============================================================ */}
        {/* 5. BOARD OF DIRECTORS                                          */}
        {/* ============================================================ */}
        <SectionCard id="board" title={tr("مجلس الإدارة", "Board of Directors")}
          eyebrow={tr("٥", "5")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("board")} onMove={moveSection}>
          <div className="mt-4">
            <EyebrowRow form={form} keyAr="board_eyebrow_ar" keyEn="board_eyebrow_en"
              sectionKey="board" testid="board" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="board_title_ar" keyEn="board_title_en"
              labelAr="العنوان الرئيسي" labelEn="Main heading"
              testid="board-title" sectionKey="board" fieldKey="title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="board_blurb_ar" keyEn="board_blurb_en"
              labelAr="نص تعريفي قصير" labelEn="Short blurb" multiline rows={3}
              testid="board-blurb" sectionKey="board" fieldKey="blurb" />
          </div>

          <div className="mt-5 px-3 py-3 bg-amber-50/40 border border-rule">
            <div className="text-[11px] uppercase tracking-[0.16em] text-brass mb-2">{tr("تنسيق بطاقات الأعضاء (يطبّق على الكل)", "Member-card typography (applies to all)")}</div>
            <div className="text-[10.5px] text-mute mb-1">{tr("الاسم", "Name")}</div>
            <FieldTypoControls form={form} sectionKey="board" fieldKey="name" testid="typo-board-name" />
            <div className="text-[10.5px] text-mute mb-1">{tr("المنصب", "Role")}</div>
            <FieldTypoControls form={form} sectionKey="board" fieldKey="role" testid="typo-board-role" />
            <div className="text-[10.5px] text-mute mb-1">{tr("نبذة", "Bio")}</div>
            <FieldTypoControls form={form} sectionKey="board" fieldKey="bio" testid="typo-board-bio" />
          </div>

          <div className="mt-5">
            {(board || []).map((m, i) => (
              <ItemRow key={m.id || i} index={i} total={board.length}
                onMove={moveMember} onRemove={removeMember} testid={`board-${i}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Field label={tr("الاسم — عربية", "Name AR")}>
                    <TextInput value={m.name_ar || ""} onChange={(v) => updateMember(i, { name_ar: v })} dir="rtl" testid={`board-${i}-name-ar`} />
                  </Field>
                  <Field label={tr("الاسم — إنجليزية", "Name EN")}>
                    <TextInput value={m.name_en || ""} onChange={(v) => updateMember(i, { name_en: v })} testid={`board-${i}-name-en`} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                  <Field label={tr("المنصب — عربية", "Role AR")}>
                    <TextInput value={m.role_ar || ""} onChange={(v) => updateMember(i, { role_ar: v })} dir="rtl" testid={`board-${i}-role-ar`} />
                  </Field>
                  <Field label={tr("المنصب — إنجليزية", "Role EN")}>
                    <TextInput value={m.role_en || ""} onChange={(v) => updateMember(i, { role_en: v })} testid={`board-${i}-role-en`} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                  <Field label={tr("نبذة — عربية", "Bio AR")}>
                    <TextArea value={m.bio_ar || ""} onChange={(v) => updateMember(i, { bio_ar: v })} dir="rtl" rows={2} testid={`board-${i}-bio-ar`} />
                  </Field>
                  <Field label={tr("نبذة — إنجليزية", "Bio EN")}>
                    <TextArea value={m.bio_en || ""} onChange={(v) => updateMember(i, { bio_en: v })} rows={2} testid={`board-${i}-bio-en`} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 items-start">
                  <ImageUploader
                    value={m.image_url || ""}
                    onChange={(v) => updateMember(i, { image_url: v })}
                    label={tr("صورة شخصية (4:5)", "Portrait photo (4:5)")}
                    testid={`board-${i}-img`}
                    hint={tr("يفضّل صورة بنسبة 4:5، الوجه في الثلث العلوي.", "Recommended 4:5 ratio, face in the upper third.")}
                  />
                  <Field label={tr("LinkedIn (اختياري)", "LinkedIn (optional)")}>
                    <TextInput value={m.linkedin || ""} onChange={(v) => updateMember(i, { linkedin: v })}
                      placeholder="https://www.linkedin.com/in/…" testid={`board-${i}-linkedin`} />
                  </Field>
                </div>
              </ItemRow>
            ))}
            <button type="button" onClick={addMember}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-navy-deep border border-rule px-3 py-1.5 hover:border-brass hover:text-brass"
              data-testid="add-board-member">
              <Plus size={13} /> {tr("إضافة عضو", "Add member")}
            </button>
          </div>

          <div className="mt-5">
            <BgImageBlock form={form} sectionKey="board" defaultOverlay={0.85}
              label={tr("صورة خلفية القسم (اختيارية)", "Section background (optional)")} />
          </div>
          <BgColorControl form={form} sectionKey="board" labelAr="لون خلفية القسم" labelEn="Section background color" />
          <GradientAccentControl form={form} sectionKey="board" />
        </SectionCard>

        {/* ============================================================ */}
        {/* 5.5 STATS / KPI                                                */}
        {/* ============================================================ */}
        <SectionCard id="stats" title={tr("إحصائيات وأرقام مميزة", "Stats & KPIs")}
          eyebrow={tr("٥٫٥", "5.5")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("stats")} onMove={moveSection}>
          <div className="mt-4">
            <EyebrowRow form={form} keyAr="stats_eyebrow_ar" keyEn="stats_eyebrow_en"
              sectionKey="stats" testid="stats" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="stats_title_ar" keyEn="stats_title_en"
              labelAr="العنوان الرئيسي" labelEn="Main heading"
              testid="stats-title" sectionKey="stats" fieldKey="title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="stats_blurb_ar" keyEn="stats_blurb_en"
              labelAr="نص تعريفي قصير" labelEn="Short blurb" multiline rows={2}
              testid="stats-blurb" sectionKey="stats" fieldKey="blurb" />
          </div>

          {/* Typography for value (number) + label (caption under it) */}
          <div className="mt-5 px-3 py-3 bg-amber-50/40 border border-rule">
            <div className="text-[11px] uppercase tracking-[0.16em] text-brass mb-2">
              {tr("تنسيق الأرقام والوصف (يطبّق على الكل)", "Number & label typography (applies to all)")}
            </div>
            <div className="text-[10.5px] text-mute mb-1">{tr("الرقم", "Number value")}</div>
            <FieldTypoControls form={form} sectionKey="stats" fieldKey="value" testid="typo-stats-value" />
            <div className="text-[10.5px] text-mute mb-1">{tr("الوصف تحت الرقم", "Caption under number")}</div>
            <FieldTypoControls form={form} sectionKey="stats" fieldKey="label" testid="typo-stats-label" />
          </div>

          {/* Stat tiles CRUD */}
          <div className="mt-5">
            {(stats || []).map((s, i) => (
              <ItemRow key={s.id || i} index={i} total={stats.length}
                onMove={moveStat} onRemove={removeStat} testid={`stat-${i}`}>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
                  <Field label={tr("القيمة (رقم)", "Value (number)")}>
                    <TextInput
                      type="number"
                      value={s.value ?? ""}
                      onChange={(v) => updateStat(i, { value: v === "" ? 0 : Number(v) })}
                      placeholder="120" testid={`stat-${i}-value`} />
                  </Field>
                  <Field label={tr("بادئة (اختياري)", "Prefix (optional)")}>
                    <TextInput value={s.prefix || ""} onChange={(v) => updateStat(i, { prefix: v })}
                      placeholder="$, ~, …" testid={`stat-${i}-prefix`} />
                  </Field>
                  <Field label={tr("لاحقة — عربية", "Suffix — AR")}>
                    <TextInput value={s.suffix_ar || ""} onChange={(v) => updateStat(i, { suffix_ar: v })}
                      dir="rtl" placeholder="+ ، % ، سنوات" testid={`stat-${i}-suffix-ar`} />
                  </Field>
                  <Field label={tr("لاحقة — إنجليزية", "Suffix — EN")}>
                    <TextInput value={s.suffix_en || ""} onChange={(v) => updateStat(i, { suffix_en: v })}
                      placeholder="+, %, yrs" testid={`stat-${i}-suffix-en`} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                  <Field label={tr("الوصف — عربية", "Caption — AR")}>
                    <TextInput value={s.label_ar || ""} onChange={(v) => updateStat(i, { label_ar: v })}
                      dir="rtl" placeholder="إصدار وبحث قانوني" testid={`stat-${i}-label-ar`} />
                  </Field>
                  <Field label={tr("الوصف — إنجليزية", "Caption — EN")}>
                    <TextInput value={s.label_en || ""} onChange={(v) => updateStat(i, { label_en: v })}
                      placeholder="Publications & studies" testid={`stat-${i}-label-en`} />
                  </Field>
                </div>
                {/* Inline preview */}
                <div className="mt-3 px-3 py-2 bg-navy-deep text-paper border border-rule flex items-center justify-center gap-3" style={{ fontFamily: '"Thmanyah Serif Display", serif' }}>
                  <span style={{ fontSize: 28, color: "var(--tb-gold)", letterSpacing: "-0.02em" }}>
                    {s.prefix || ""}{Number(s.value) || 0}{(lang === "ar" ? s.suffix_ar : s.suffix_en) || ""}
                  </span>
                  <span style={{ height: 1, width: 18, background: "var(--tb-gold)", opacity: 0.6 }} />
                  <span style={{ fontFamily: '"Thmanyah Sans", sans-serif', fontSize: 12, opacity: 0.8 }}>
                    {lang === "ar" ? (s.label_ar || "—") : (s.label_en || "—")}
                  </span>
                </div>
              </ItemRow>
            ))}
            <button type="button" onClick={addStat}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-navy-deep border border-rule px-3 py-1.5 hover:border-brass hover:text-brass"
              data-testid="add-stat">
              <Plus size={13} /> {tr("إضافة رقم", "Add stat")}
            </button>
            <p className="mt-2 text-[11.5px] text-mute">
              {tr(
                "يُفضّل 4 أو 8 أرقام للتوافق مع شبكة العرض. الأرقام تتحرّك من 0 إلى القيمة عند ظهور القسم.",
                "Best with 4 or 8 stats for clean grid. Counters animate from 0 → value when section enters viewport.",
              )}
            </p>
          </div>

          <div className="mt-5">
            <BgImageBlock form={form} sectionKey="stats" defaultOverlay={0.7}
              label={tr("صورة خلفية القسم (اختيارية)", "Section background (optional)")} />
          </div>
          <BgColorControl form={form} sectionKey="stats" labelAr="لون خلفية القسم" labelEn="Section background color" />
          <GradientAccentControl form={form} sectionKey="stats" />
        </SectionCard>

        {/* ============================================================ */}
        {/* 6. SUCCESS PARTNERS                                            */}
        {/* ============================================================ */}
        <SectionCard id="partners" title={tr("شركاء النجاح", "Success Partners")}
          eyebrow={tr("٦", "6")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("partners")} onMove={moveSection}>
          <div className="mt-4">
            <EyebrowRow form={form} keyAr="partners_eyebrow_ar" keyEn="partners_eyebrow_en"
              sectionKey="partners" testid="partners" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="partners_title_ar" keyEn="partners_title_en"
              labelAr="العنوان الرئيسي" labelEn="Main heading"
              testid="partners-title" sectionKey="partners" fieldKey="title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="partners_blurb_ar" keyEn="partners_blurb_en"
              labelAr="نص تعريفي قصير" labelEn="Short blurb" multiline rows={3}
              testid="partners-blurb" sectionKey="partners" fieldKey="blurb" />
          </div>

          {/* Logo-size slider — controls the marquee logo height (default 1× = 100px) */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <FontScaleSlider
                form={form}
                sectionKey="partners"
                styleKey="logo_scale"
                labelAr="حجم الشعارات (في الشريط المتحرك)"
                labelEn="Logo size (marquee)"
                min={0.6}
                max={2.5}
                step={0.1}
              />
              <p className="mt-1.5 text-[11.5px] text-mute px-1">
                {tr(
                  "يتحكم في ارتفاع الشعارات داخل الشريط المتحرك. الافتراضي 100% = 100 بكسل.",
                  "Controls logo height inside the marquee. Default 100% = 100px.",
                )}
              </p>
            </div>
            <div>
              <FontScaleSlider
                form={form}
                sectionKey="partners"
                styleKey="logo_gap"
                labelAr="المسافة بين الشعارات"
                labelEn="Spacing between logos"
                min={0}
                max={20}
                step={0.2}
              />
              <p className="mt-1.5 text-[11.5px] text-mute px-1">
                {tr(
                  "يتحكم في المسافة الأفقية بين الشعارات. الافتراضي 100% = 5 بكسل (متلاصقة تقريباً).",
                  "Horizontal spacing between logos. Default 100% = 5px (tight).",
                )}
              </p>
            </div>
          </div>

          <div className="mt-5">
            {(partners || []).map((p, i) => (
              <ItemRow key={p.id || i} index={i} total={partners.length}
                onMove={movePartner} onRemove={removePartner} testid={`partner-${i}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Field label={tr("اسم الجهة — عربية", "Name AR")}>
                    <TextInput value={p.name_ar || ""} onChange={(v) => updatePartner(i, { name_ar: v })} dir="rtl" testid={`partner-${i}-name-ar`} />
                  </Field>
                  <Field label={tr("اسم الجهة — إنجليزية", "Name EN")}>
                    <TextInput value={p.name_en || ""} onChange={(v) => updatePartner(i, { name_en: v })} testid={`partner-${i}-name-en`} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3 items-start">
                  <ImageUploader
                    value={p.logo_url || ""}
                    onChange={(v) => updatePartner(i, { logo_url: v })}
                    label={tr("الشعار (يفضّل PNG شفاف)", "Logo (preferably transparent PNG)")}
                    testid={`partner-${i}-logo`}
                    hint={tr("سيُعرض بالأبيض والأسود ويتلوّن عند تمرير المؤشر.", "Displayed in grayscale; restores color on hover.")}
                  />
                  <Field label={tr("الرابط (اختياري)", "Link (optional)")}>
                    <TextInput value={p.link || ""} onChange={(v) => updatePartner(i, { link: v })}
                      placeholder="https://…" testid={`partner-${i}-link`} />
                  </Field>
                </div>
              </ItemRow>
            ))}
            <button type="button" onClick={addPartner}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-navy-deep border border-rule px-3 py-1.5 hover:border-brass hover:text-brass"
              data-testid="add-partner">
              <Plus size={13} /> {tr("إضافة شريك", "Add partner")}
            </button>
          </div>

          <div className="mt-5">
            <BgImageBlock form={form} sectionKey="partners" defaultOverlay={0.85}
              label={tr("صورة خلفية القسم (اختيارية)", "Section background (optional)")} />
          </div>
          <BgColorControl form={form} sectionKey="partners" labelAr="لون خلفية القسم" labelEn="Section background color" />
          <GradientAccentControl form={form} sectionKey="partners" />
        </SectionCard>

        {/* ============================================================ */}
        {/* 7. CONTACT CTA                                                 */}
        {/* ============================================================ */}
        <SectionCard id="contact_cta" title={tr("دعوة للتواصل", "Contact CTA")}
          eyebrow={tr("٧", "7")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("contact_cta")} onMove={moveSection}>
          <div className="mt-4">
            <EyebrowRow form={form} keyAr="contact_eyebrow_ar" keyEn="contact_eyebrow_en"
              sectionKey="contact_cta" testid="cta" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="contact_title_ar" keyEn="contact_title_en"
              labelAr="العنوان" labelEn="Heading"
              testid="cta-title" sectionKey="contact_cta" fieldKey="title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="contact_blurb_ar" keyEn="contact_blurb_en"
              labelAr="نص تعريفي" labelEn="Blurb" multiline rows={3}
              testid="cta-blurb" sectionKey="contact_cta" fieldKey="blurb" />
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <FieldTypoControls form={form} sectionKey="contact_cta" fieldKey="button" testid="typo-cta-button" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Field label={tr("نص الزر — عربية", "Button label AR")}>
                  <TextInput value={form.value.contact_cta_label_ar || ""} onChange={(v) => form.patch("contact_cta_label_ar", v)} dir="rtl" testid="cta-btn-ar" />
                </Field>
                <Field label={tr("نص الزر — إنجليزية", "Button label EN")}>
                  <TextInput value={form.value.contact_cta_label_en || ""} onChange={(v) => form.patch("contact_cta_label_en", v)} testid="cta-btn-en" />
                </Field>
              </div>
            </div>
            <Field label={tr("رابط الزر", "Button link")}>
              <TextInput value={form.value.contact_cta_link || ""} onChange={(v) => form.patch("contact_cta_link", v)}
                placeholder="/contact" testid="cta-link" />
            </Field>
          </div>
          <div className="mt-5">
            <BgImageBlock form={form} sectionKey="contact_cta" defaultOverlay={0.62}
              label={tr("صورة خلفية القسم (اختيارية)", "Section background (optional)")} />
          </div>
          <BgColorControl form={form} sectionKey="contact_cta" labelAr="لون خلفية القسم" labelEn="Section background color" />
          <GradientAccentControl form={form} sectionKey="contact_cta" />
        </SectionCard>

      </div>

      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
    </AdminPage>
  );
}

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, FileDown, Upload } from "lucide-react";
import { AdminPage, Field, TextInput, TextArea, SaveBar, useDirtyForm, apiCall } from "@/admin/components/AdminUI";
import {
  SectionCard, BgImageBlock, BgColorControl, GradientAccentControl,
  EyebrowRow, BiInput, ImageUploader, FieldTypoControls, moveItem,
} from "@/admin/components/sectionControls";
import { useLang } from "@/i18n/LanguageContext";
import { invalidateSiteCache } from "@/hooks/useSiteSettings";
import { api, formatApiError } from "@/lib/api";

const SECTIONS = ["hero", "intro", "fellows"];
const LABELS_AR = { hero: "البطل (Hero)", intro: "المقدمة", fellows: "الزملاء" };
const LABELS_EN = { hero: "Hero", intro: "Introduction", fellows: "Fellows" };

function uid() { return Math.random().toString(36).slice(2, 10); }

/** Item row with reorder + remove controls */
function ItemRow({ index, total, onMove, onRemove, children, testid }) {
  const canUp = index > 0;
  const canDown = index < total - 1;
  return (
    <div className="border border-rule bg-white p-4 mb-3" data-testid={testid}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11.5px] uppercase tracking-[0.18em] text-brass">
          #{String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-1.5">
          <button type="button" disabled={!canUp} onClick={() => onMove(index, index - 1)}
            className="w-7 h-7 border border-rule text-mute hover:text-navy-deep hover:border-brass disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid={`${testid}-up`}>↑</button>
          <button type="button" disabled={!canDown} onClick={() => onMove(index, index + 1)}
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

/** PDF uploader — same as AboutAdmin */
function CvPdfUploader({ value, onChange, tr, testid }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads/pdf", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(data.url);
    } catch (e) {
      setMsg(formatApiError(e.response?.data?.detail) || e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label={tr("السيرة الذاتية PDF (اختياري)", "CV / Resume PDF (optional)")}>
      <div className="space-y-2">
        {value && (
          <div className="flex items-center gap-2 text-[12.5px]">
            <FileDown size={13} className="text-brass shrink-0" />
            <a href={value} target="_blank" rel="noreferrer"
              className="text-navy hover:text-brass truncate max-w-[200px]" data-testid={`${testid}-link`}>
              {tr("عرض الملف", "View file")}
            </a>
            <button type="button" onClick={() => onChange("")}
              className="text-mute hover:text-red-700 text-[11px] underline ms-1">
              {tr("إزالة", "Remove")}
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <TextInput value={value} onChange={onChange} placeholder="https://…pdf" testid={`${testid}-url`} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="shrink-0 inline-flex items-center gap-1 px-3 h-11 border border-rule hover:border-brass text-[12.5px] text-navy-deep hover:text-brass transition-colors"
            data-testid={`${testid}-upload`}>
            <Upload size={13} />
            {uploading ? tr("جارٍ الرفع…", "Uploading…") : tr("رفع", "Upload")}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/pdf" hidden
          onChange={(e) => handleFile(e.target.files?.[0])} />
        {msg && <div className="text-[11.5px] text-red-700">{msg}</div>}
      </div>
    </Field>
  );
}

export default function FellowsPageAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const form = useDirtyForm({});

  const DEFAULTS = {
    hero_eyebrow_ar: "مجتمع البحث", hero_eyebrow_en: "Research Community",
    hero_title_ar: "زملاء لزام", hero_title_en: "LIZAM Fellows",
    hero_subtitle_ar: "باحثون متميزون يساهمون في تطوير المنظومة القانونية بالمملكة العربية السعودية.",
    hero_subtitle_en: "Distinguished researchers contributing to the development of Saudi Arabia's legal landscape.",
    intro_eyebrow_ar: "من نحن", intro_eyebrow_en: "About",
    intro_title_ar: "برنامج زمالة لزام", intro_title_en: "LIZAM Fellowship Program",
    intro_body_ar: "يجمع برنامج زمالة لزام نخبة من الباحثين القانونيين المتميزين.",
    intro_body_en: "The LIZAM Fellowship Program brings together distinguished legal researchers.",
    fellows_eyebrow_ar: "الزملاء", fellows_eyebrow_en: "Our Fellows",
    fellows_title_ar: "زملاء المركز", fellows_title_en: "Center Fellows",
    fellows_body_ar: "يضم المركز نخبة من الباحثين والمختصين في مجالات القانون المختلفة.",
    fellows_body_en: "The Center comprises distinguished researchers and specialists in various fields of law.",
    fellows_members: [],
  };

  useEffect(() => {
    apiCall("get", "/admin/fellows-page").then((r) => {
      if (r.ok) form.commit({ ...DEFAULTS, ...(r.data || {}) });
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const r = await apiCall("patch", "/admin/fellows-page", form.value);
    setSaving(false);
    if (r.ok) {
      form.commit(r.data);
      invalidateSiteCache("fellows");
      setMsg(tr("تم الحفظ ✓", "Saved ✓"));
      setTimeout(() => setMsg(""), 3500);
    } else setMsg(`${tr("خطأ", "Error")}: ${r.error}`);
  }

  if (!loaded) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  const visible = form.value.visible_sections || SECTIONS;
  const toggleVisibility = (id) => {
    const next = visible.includes(id) ? visible.filter(s => s !== id) : [...visible, id];
    form.patch("visible_sections", next);
  };
  const hidden = SECTIONS.filter(s => !visible.includes(s));
  const sectionLabel = (k) => (lang === "ar" ? LABELS_AR[k] : LABELS_EN[k]) || k;
  const moveSection = (from, to) => form.patch("visible_sections", moveItem(visible, from, to));
  const orderInfo = (id) => ({ orderIndex: visible.indexOf(id) >= 0 ? visible.indexOf(id) : undefined, orderTotal: visible.length });

  // ── Fellows members ──
  const fellows = form.value.fellows_members || [];
  const updateFellow = (i, patch) =>
    form.patch("fellows_members", fellows.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const moveFellow = (from, to) => form.patch("fellows_members", moveItem(fellows, from, to));
  const addFellow = () =>
    form.patch("fellows_members", [...fellows, { id: uid(), name_ar: "", name_en: "", role_ar: "", role_en: "", bio_ar: "", bio_en: "", image_url: "", linkedin: "", cv_pdf_url: "" }]);
  const removeFellow = (i) => form.patch("fellows_members", fellows.filter((_, idx) => idx !== i));

  return (
    <AdminPage
      title={tr("محتوى صفحة زملاء لزام", "LIZAM Fellows Page")}
      subtitle={tr("مجتمع الباحثين والزملاء", "Researchers & Fellows community")}
      helpAr="تحكم في نصوص صفحة زملاء لزام وبيانات الزملاء. الصفحة العامة: /fellows"
      helpEn="Edit all text on the LIZAM Fellows page and manage fellow profiles. Public page: /fellows."
    >
      <div className="max-w-[1180px] flex flex-col gap-6">
        {hidden.length > 0 && (
          <div className="border border-rule bg-paper px-5 py-4">
            <div className="text-[11.5px] uppercase tracking-[0.18em] text-mute mb-2">{tr("أقسام مخفية", "Hidden sections")}</div>
            <div className="flex flex-wrap gap-2">
              {hidden.map(k => (
                <button key={k} type="button" onClick={() => toggleVisibility(k)}
                  className="text-[12px] px-3 py-1 border border-rule bg-white hover:border-brass hover:text-navy-deep">
                  + {sectionLabel(k)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 1. HERO ── */}
        <SectionCard id="hero" title={tr("قسم البطل (Hero)", "Hero")} eyebrow={tr("١","1")}
          visibleSections={visible} onToggleVisibility={toggleVisibility} {...orderInfo("hero")} onMove={moveSection}>
          <div className="mt-4"><EyebrowRow form={form} keyAr="hero_eyebrow_ar" keyEn="hero_eyebrow_en" sectionKey="hero" /></div>
          <div className="mt-4"><BiInput form={form} keyAr="hero_title_ar" keyEn="hero_title_en" labelAr="العنوان" labelEn="Title" multiline={false} sectionKey="hero" fieldKey="title" /></div>
          <div className="mt-4"><BiInput form={form} keyAr="hero_subtitle_ar" keyEn="hero_subtitle_en" labelAr="النص الفرعي" labelEn="Subtitle" multiline rows={3} sectionKey="hero" fieldKey="subtitle" /></div>
          <div className="mt-5"><BgImageBlock form={form} sectionKey="hero" defaultOverlay={0.62} label={tr("صورة خلفية", "Background image")} /></div>
          <BgColorControl form={form} sectionKey="hero" />
          <GradientAccentControl form={form} sectionKey="hero" />
        </SectionCard>

        {/* ── 2. INTRO ── */}
        <SectionCard id="intro" title={tr("المقدمة", "Introduction")} eyebrow={tr("٢","2")}
          visibleSections={visible} onToggleVisibility={toggleVisibility} {...orderInfo("intro")} onMove={moveSection}>
          <div className="mt-4"><EyebrowRow form={form} keyAr="intro_eyebrow_ar" keyEn="intro_eyebrow_en" sectionKey="intro" /></div>
          <div className="mt-4"><BiInput form={form} keyAr="intro_title_ar" keyEn="intro_title_en" labelAr="العنوان" labelEn="Title" multiline={false} sectionKey="intro" fieldKey="title" /></div>
          <div className="mt-4"><BiInput form={form} keyAr="intro_body_ar" keyEn="intro_body_en" labelAr="النص" labelEn="Body" multiline rows={4} sectionKey="intro" fieldKey="body" /></div>
          <BgColorControl form={form} sectionKey="intro" />
        </SectionCard>

        {/* ── 3. FELLOWS ── */}
        <SectionCard id="fellows" title={tr("الزملاء", "Fellows")} eyebrow={tr("٣","3")}
          visibleSections={visible} onToggleVisibility={toggleVisibility} {...orderInfo("fellows")} onMove={moveSection}>
          <div className="mt-4"><EyebrowRow form={form} keyAr="fellows_eyebrow_ar" keyEn="fellows_eyebrow_en" sectionKey="fellows" /></div>
          <div className="mt-4"><BiInput form={form} keyAr="fellows_title_ar" keyEn="fellows_title_en" labelAr="عنوان القسم" labelEn="Section title" multiline={false} sectionKey="fellows" fieldKey="title" /></div>
          <div className="mt-4"><BiInput form={form} keyAr="fellows_body_ar" keyEn="fellows_body_en" labelAr="نص تعريفي" labelEn="Intro blurb" multiline rows={3} sectionKey="fellows" fieldKey="body" /></div>

          {/* Typography controls */}
          <div className="mt-5 px-3 py-3 bg-amber-50/40 border border-rule">
            <div className="text-[11px] uppercase tracking-[0.16em] text-brass mb-2">{tr("تنسيق بطاقات الزملاء (يطبّق على الكل)", "Fellow-card typography (applies to all)")}</div>
            <div className="text-[10.5px] text-mute mb-1">{tr("الاسم", "Name")}</div>
            <FieldTypoControls form={form} sectionKey="fellows" fieldKey="name" testid="typo-fellows-name" />
            <div className="text-[10.5px] text-mute mb-1">{tr("التخصص / المنصب", "Specialization / Role")}</div>
            <FieldTypoControls form={form} sectionKey="fellows" fieldKey="role" testid="typo-fellows-role" />
            <div className="text-[10.5px] text-mute mb-1">{tr("نبذة", "Bio")}</div>
            <FieldTypoControls form={form} sectionKey="fellows" fieldKey="bio" testid="typo-fellows-bio" />
          </div>

          {/* Members list */}
          <div className="mt-5">
            {fellows.map((m, i) => (
              <ItemRow key={m.id || i} index={i} total={fellows.length}
                onMove={moveFellow} onRemove={removeFellow} testid={`fellow-${i}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Field label={tr("الاسم — عربية", "Name AR")}>
                    <TextInput value={m.name_ar || ""} onChange={(v) => updateFellow(i, { name_ar: v })} dir="rtl" testid={`fellow-${i}-name-ar`} />
                  </Field>
                  <Field label={tr("الاسم — إنجليزية", "Name EN")}>
                    <TextInput value={m.name_en || ""} onChange={(v) => updateFellow(i, { name_en: v })} testid={`fellow-${i}-name-en`} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                  <Field label={tr("التخصص / المنصب — عربية", "Role / Specialization AR")}>
                    <TextInput value={m.role_ar || ""} onChange={(v) => updateFellow(i, { role_ar: v })} dir="rtl" testid={`fellow-${i}-role-ar`} />
                  </Field>
                  <Field label={tr("التخصص / المنصب — إنجليزية", "Role / Specialization EN")}>
                    <TextInput value={m.role_en || ""} onChange={(v) => updateFellow(i, { role_en: v })} testid={`fellow-${i}-role-en`} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                  <Field label={tr("نبذة — عربية", "Bio AR")}>
                    <TextArea value={m.bio_ar || ""} onChange={(v) => updateFellow(i, { bio_ar: v })} dir="rtl" rows={2} testid={`fellow-${i}-bio-ar`} />
                  </Field>
                  <Field label={tr("نبذة — إنجليزية", "Bio EN")}>
                    <TextArea value={m.bio_en || ""} onChange={(v) => updateFellow(i, { bio_en: v })} rows={2} testid={`fellow-${i}-bio-en`} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 items-start">
                  <ImageUploader
                    value={m.image_url || ""}
                    onChange={(v) => updateFellow(i, { image_url: v })}
                    label={tr("صورة شخصية (4:5)", "Portrait photo (4:5)")}
                    testid={`fellow-${i}-img`}
                    hint={tr("يفضّل صورة بنسبة 4:5، الوجه في الثلث العلوي.", "Recommended 4:5 ratio, face in the upper third.")}
                  />
                  <Field label={tr("LinkedIn (اختياري)", "LinkedIn (optional)")}>
                    <TextInput value={m.linkedin || ""} onChange={(v) => updateFellow(i, { linkedin: v })}
                      placeholder="https://www.linkedin.com/in/…" testid={`fellow-${i}-linkedin`} />
                  </Field>
                  <CvPdfUploader
                    value={m.cv_pdf_url || ""}
                    onChange={(v) => updateFellow(i, { cv_pdf_url: v })}
                    tr={tr}
                    testid={`fellow-${i}-cv`}
                  />
                </div>
              </ItemRow>
            ))}
            <button type="button" onClick={addFellow}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-navy-deep border border-rule px-3 py-1.5 hover:border-brass hover:text-brass"
              data-testid="add-fellow">
              <Plus size={13} /> {tr("إضافة زميل", "Add fellow")}
            </button>
          </div>

          <BgColorControl form={form} sectionKey="fellows" />
        </SectionCard>
      </div>

      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
    </AdminPage>
  );
}

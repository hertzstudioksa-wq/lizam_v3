import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AdminPage, Field, TextInput, TextArea, SaveBar, apiCall,
} from "@/admin/components/AdminUI";
import {
  SectionCard, ImageUploader, moveItem,
} from "@/admin/components/sectionControls";
import TiptapField from "@/admin/components/TiptapField";
import { SECTION_TYPES } from "@/lib/sectionRegistry";
import { useLang } from "@/i18n/LanguageContext";
import { api } from "@/lib/api";

export default function CustomPageAdmin() {
  const { id } = useParams();
  const { lang } = useLang();
  const tr = (ar, en) => lang === "ar" ? ar : en;

  const [page, setPage]           = useState(null);
  const [sections, setSections]   = useState([]);  // [{id, type, config}]
  const [visible, setVisible]     = useState([]);  // ids of visible sections
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState("");

  // ── Load page ────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/admin/custom-pages/${id}`)
      .then(({ data }) => {
        setPage(data);
        const secs = (data.sections || []).map((s, i) => ({
          ...s,
          _id: s._id || `sec-${i}-${Date.now()}`,
        }));
        setSections(secs);
        setVisible(secs.map(s => s._id));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // ── Dirty tracking ───────────────────────────────────────────────────────
  const [initialSnap, setInitialSnap] = useState(null);
  useEffect(() => {
    if (sections.length > 0 && initialSnap === null) {
      setInitialSnap(JSON.stringify(sections));
    }
  }, [sections]); // eslint-disable-line
  const dirty = initialSnap !== null && initialSnap !== JSON.stringify(sections);

  // ── Section ordering ─────────────────────────────────────────────────────
  function moveSection(from, to) {
    const next = moveItem(sections, from, to);
    setSections(next);
    setVisible(next.map(s => s._id));
  }

  // ── Section visibility ───────────────────────────────────────────────────
  function toggleVisibility(sId) {
    setVisible(prev =>
      prev.includes(sId) ? prev.filter(x => x !== sId) : [...prev, sId]
    );
  }

  // ── Section config edit ──────────────────────────────────────────────────
  function patchConfig(sId, key, value) {
    setSections(prev =>
      prev.map(s => s._id === sId
        ? { ...s, config: { ...s.config, [key]: value } }
        : s
      )
    );
  }

  // ── Add section ──────────────────────────────────────────────────────────
  function addSection(type) {
    const def = SECTION_TYPES[type];
    if (!def) return;
    const newSec = {
      type,
      config: { ...(def.defaultConfig || {}) },
      _id: `sec-${type}-${Date.now()}`,
    };
    const next = [...sections, newSec];
    setSections(next);
    setVisible(prev => [...prev, newSec._id]);
    setShowPicker(false);
  }

  // ── Delete section ───────────────────────────────────────────────────────
  function deleteSection(sId) {
    setSections(prev => prev.filter(s => s._id !== sId));
    setVisible(prev => prev.filter(x => x !== sId));
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function save() {
    setSaving(true);
    // Strip internal _id, keep only visible sections in order
    const payload = sections
      .filter(s => visible.includes(s._id))
      .map(({ _id, ...rest }) => rest); // eslint-disable-line no-unused-vars
    // Also save hidden sections at end (marked visible:false) or just save all
    const allPayload = sections.map(({ _id, ...rest }) => ({ // eslint-disable-line no-unused-vars
      ...rest,
      _visible: visible.includes(_id),
    }));
    const r = await apiCall("patch", `/admin/custom-pages/${id}`, {
      sections: allPayload,
    });
    setSaving(false);
    if (r.ok) {
      setInitialSnap(JSON.stringify(sections));
      setMsg(tr("تم الحفظ ✓ — الصفحة حُدِّثت فوراً.", "Saved ✓ — page updated."));
      setTimeout(() => setMsg(""), 3000);
    } else {
      setMsg(tr("خطأ في الحفظ", "Save error"));
    }
  }

  function reset() {
    if (initialSnap) {
      const restored = JSON.parse(initialSnap);
      setSections(restored);
      setVisible(restored.map(s => s._id));
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;
  if (!page)   return <div className="p-10 text-red-600">{tr("الصفحة غير موجودة.", "Page not found.")}</div>;

  const pageTitle = lang === "ar"
    ? (page.title_ar || page.title_en || page.slug)
    : (page.title_en || page.title_ar || page.slug);

  // Hidden sections panel
  const hiddenSections = sections.filter(s => !visible.includes(s._id));

  return (
    <AdminPage
      title={pageTitle}
      subtitle={tr("داش بورد كامل — قسم بقسم", "Full dashboard — section by section")}
      helpAr={`تحكم في أقسام صفحة "${pageTitle}". اضغط على رأس البطاقة للفتح/الإغلاق. التحكم في الإظهار/الإخفاء، النصوص، الصور. الصفحة العامة: /${page.slug}`}
      helpEn={`Manage sections for "${pageTitle}". Click a card header to expand/collapse. Control visibility, text, images. Public page: /${page.slug}`}
    >
      <div className="max-w-[1180px] flex flex-col gap-6">

        {/* ── Hidden sections quick-reveal ── */}
        {hiddenSections.length > 0 && (
          <div className="border border-rule bg-paper px-5 py-4">
            <div className="text-[11.5px] uppercase tracking-[0.18em] text-mute mb-2">
              {tr("أقسام مخفية", "Hidden sections")}
            </div>
            <div className="flex flex-wrap gap-2">
              {hiddenSections.map(s => {
                const label = SECTION_TYPES[s.type]?.[`label_${lang}`] || s.type;
                return (
                  <button key={s._id} type="button" onClick={() => toggleVisibility(s._id)}
                    className="text-[12px] px-3 py-1 border border-rule bg-white hover:border-brass hover:text-navy-deep">
                    + {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Section cards ── */}
        {sections.map((section, i) => {
          const typeDef   = SECTION_TYPES[section.type] || {};
          const typeLabel = typeDef[`label_${lang}`] || section.type;

          return (
            <SectionCard
              key={section._id}
              id={section._id}
              title={typeLabel}
              eyebrow={lang === "ar" ? String(i + 1) : `${i + 1}`}
              visibleSections={visible}
              onToggleVisibility={() => toggleVisibility(section._id)}
              orderIndex={i}
              orderTotal={sections.length}
              onMove={moveSection}
            >
              {/* Config fields */}
              {(typeDef.configFields || []).map(f => (
                <div key={f.key} className="mt-4">
                  {f.type === "richtext" ? (
                    <div>
                      <div className="text-[12.5px] uppercase tracking-[0.14em] text-mute mb-2">
                        {f.label_ar || f.label_en}
                      </div>
                      <TiptapField
                        value={section.config[f.key] || ""}
                        onChange={v => patchConfig(section._id, f.key, v)}
                        dir={f.dir || "rtl"}
                        testid={`${section._id}-${f.key}`}
                      />
                    </div>
                  ) : f.type === "image" ? (
                    <Field label={f.label_ar || f.label_en}>
                      <ImageUploader
                        value={section.config[f.key] || ""}
                        onChange={v => patchConfig(section._id, f.key, v)}
                        label={f.label_ar || f.label_en}
                        testid={`${section._id}-${f.key}`}
                      />
                    </Field>
                  ) : f.type === "textarea" ? (
                    <Field label={f.label_ar || f.label_en}>
                      <TextArea
                        value={section.config[f.key] || ""}
                        onChange={v => patchConfig(section._id, f.key, v)}
                        dir={f.dir || "rtl"}
                        rows={3}
                        testid={`${section._id}-${f.key}`}
                      />
                    </Field>
                  ) : f.type === "number" ? (
                    <Field label={f.label_ar || f.label_en}>
                      <TextInput
                        type="number"
                        value={section.config[f.key] ?? ""}
                        onChange={v => patchConfig(section._id, f.key, Number(v) || 0)}
                        testid={`${section._id}-${f.key}`}
                      />
                    </Field>
                  ) : (
                    <Field label={f.label_ar || f.label_en}>
                      <TextInput
                        value={section.config[f.key] || ""}
                        onChange={v => patchConfig(section._id, f.key, v)}
                        dir={f.dir || "rtl"}
                        testid={`${section._id}-${f.key}`}
                      />
                    </Field>
                  )}
                </div>
              ))}

              {/* Delete section */}
              <div className="mt-5 pt-4 border-t border-rule">
                <button
                  type="button"
                  onClick={() => deleteSection(section._id)}
                  className="text-[12px] text-red-600 hover:text-red-800 lz-linkline"
                >
                  {tr("حذف هذا القسم", "Delete this section")}
                </button>
              </div>
            </SectionCard>
          );
        })}


      </div>


      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} savedMessage={msg} />
    </AdminPage>
  );
}

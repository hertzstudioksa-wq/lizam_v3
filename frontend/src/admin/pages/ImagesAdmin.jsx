import { useEffect, useState } from "react";
import { AdminPage, Field, TextInput, apiCall } from "@/admin/components/AdminUI";
import { useLang } from "@/i18n/LanguageContext";
import { api, formatApiError } from "@/lib/api";
import { resetImageAssetsCache } from "@/hooks/useImageAssets";

export default function ImagesAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [msg, setMsg] = useState("");
  const [drafts, setDrafts] = useState({});

  async function load() {
    setLoading(true);
    const r = await apiCall("get", "/admin/image-assets");
    if (r.ok) setSlots(r.data?.items || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function patchDraft(key, partial) {
    setDrafts((d) => ({ ...d, [key]: { ...(d[key] || {}), ...partial } }));
  }

  async function saveSlot(key) {
    const draft = drafts[key];
    if (!draft) return;
    setSavingKey(key);
    const r = await apiCall("patch", `/admin/image-assets/${key}`, draft);
    setSavingKey(null);
    if (r.ok) {
      setSlots((arr) => arr.map((s) => (s.slot_key === key ? r.data : s)));
      setDrafts((d) => { const n = { ...d }; delete n[key]; return n; });
      resetImageAssetsCache();
      setMsg(tr(`تم حفظ "${key}" ✓ — حدّث الموقع العام لرؤية التغييرات.`, `Saved "${key}" ✓ — refresh the public site to see updates.`));
      setTimeout(() => setMsg(""), 3500);
    } else {
      setMsg(`${tr("خطأ في حفظ", "Error saving")} ${key}: ${r.error}`);
    }
  }

  async function uploadFile(key, file) {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      patchDraft(key, { url: data.url });
    } catch (e) {
      setMsg(`${tr("خطأ في الرفع", "Upload error")}: ${formatApiError(e.response?.data?.detail) || e.message}`);
    }
  }

  if (loading) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  return (
    <AdminPage
      title={tr("إدارة الصور", "Image Management")}
      subtitle={tr("صور الموقع العام · الثيمة B", "Public site imagery · Theme B")}
    >
      <p className="max-w-[760px] text-[14px] text-ink/75 leading-relaxed mb-10">
        {tr(
          "تحكّم بالصور المستخدمة في أقسام الموقع العام. كل خانة لها مقاس ونسبة مُفضَّلة ليتمكن المصممون من تجهيز الأصول بدقة. يمكنك استبدال الرابط أو رفع ملف جديد. عطّل أي خانة لإخفاء صورتها (يرجع القسم إلى خلفيته الأساسية).",
          "Manage the curated images used across the public site. Each slot has a recommended size and aspect ratio so designers can prepare assets correctly. Replace the URL or upload a new file. Toggle a slot off to hide its image."
        )}
      </p>

      {msg && (
        <div className="mb-6 px-4 py-3 border-l-2 border-brass bg-paper text-[13px]" data-testid="images-status">{msg}</div>
      )}

      <div className="space-y-6 max-w-[1200px]">
        {slots.map((slot) => {
          const draft = drafts[slot.slot_key] || {};
          const merged = { ...slot, ...draft };
          const dirty = Object.keys(draft).length > 0;

          return (
            <article
              key={slot.slot_key}
              className="border border-rule bg-white p-6 grid grid-cols-1 lg:grid-cols-12 gap-6"
              data-testid={`image-slot-${slot.slot_key}`}
              style={{ borderRadius: 12 }}
            >
              <div className="lg:col-span-4">
                <div
                  className="w-full overflow-hidden bg-paper"
                  style={{
                    aspectRatio: (slot.recommended_width && slot.recommended_height)
                      ? `${slot.recommended_width}/${slot.recommended_height}`
                      : "16/9",
                    borderRadius: 8,
                    background: merged.url ? `url(${merged.url}) center/cover no-repeat` : "#EFEAE0",
                    minHeight: 140,
                  }}
                  role="img"
                  aria-label={merged.alt_en || slot.title_en}
                  data-testid={`image-preview-${slot.slot_key}`}
                />
                <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-mute">
                  {slot.recommended_width} × {slot.recommended_height}px
                  {slot.aspect_ratio && <span className="ms-2 text-brass font-semibold">{slot.aspect_ratio}</span>}
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <header className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-brass font-semibold">{slot.slot_key}</div>
                    <h3 className="text-[18px] font-medium text-navy-deep mt-1">{lang === "ar" ? slot.title_ar : slot.title_en}</h3>
                    <h4 className="text-[14.5px] text-ink/75" dir={lang === "ar" ? "ltr" : "rtl"}>{lang === "ar" ? slot.title_en : slot.title_ar}</h4>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-[13px]" data-testid={`image-active-${slot.slot_key}`}>
                    <input
                      type="checkbox"
                      checked={merged.active !== false}
                      onChange={(e) => patchDraft(slot.slot_key, { active: e.target.checked })}
                    />
                    <span>{merged.active !== false ? tr("نشط", "Active") : tr("غير نشط", "Inactive")}</span>
                  </label>
                </header>

                <div className="text-[13px] text-mute leading-relaxed">
                  <strong className="text-navy-deep">{tr("الاستخدام:", "Usage:")}</strong> {lang === "ar" ? slot.usage_note_ar : slot.usage_note_en}
                </div>

                <Field label={tr("رابط الصورة", "Image URL")} hint={tr("الصق رابطاً مستضافاً أو ارفع ملفاً أدناه", "Paste a hosted URL or upload below")}>
                  <div className="flex gap-2">
                    <TextInput value={merged.url || ""} onChange={(v) => patchDraft(slot.slot_key, { url: v })} testid={`image-url-${slot.slot_key}`} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => uploadFile(slot.slot_key, e.target.files?.[0])}
                      className="text-[13px]"
                      data-testid={`image-upload-${slot.slot_key}`}
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label={tr("النص البديل · العربية", "Alt text · Arabic")} dir="rtl">
                    <TextInput value={merged.alt_ar || ""} onChange={(v) => patchDraft(slot.slot_key, { alt_ar: v })} testid={`alt-ar-${slot.slot_key}`} />
                  </Field>
                  <Field label={tr("النص البديل · الإنجليزية", "Alt text · English")}>
                    <TextInput value={merged.alt_en || ""} onChange={(v) => patchDraft(slot.slot_key, { alt_en: v })} testid={`alt-en-${slot.slot_key}`} />
                  </Field>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => saveSlot(slot.slot_key)}
                    disabled={!dirty || savingKey === slot.slot_key}
                    className={`px-4 py-2 text-[13px] ${dirty ? "bg-navy-deep text-white" : "bg-rule text-mute cursor-not-allowed"}`}
                    style={{ borderRadius: 6 }}
                    data-testid={`image-save-${slot.slot_key}`}
                  >
                    {savingKey === slot.slot_key ? tr("جارٍ الحفظ…", "Saving…") : (dirty ? tr("حفظ التغييرات", "Save changes") : tr("لا تغييرات", "No changes"))}
                  </button>
                  {dirty && (
                    <button
                      type="button"
                      onClick={() => setDrafts((d) => { const n = { ...d }; delete n[slot.slot_key]; return n; })}
                      className="text-[13px] text-mute hover:text-navy underline underline-offset-4"
                      data-testid={`image-cancel-${slot.slot_key}`}
                    >
                      {tr("تجاهل", "Discard")}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </AdminPage>
  );
}

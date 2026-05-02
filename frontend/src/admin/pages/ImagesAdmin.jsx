import { useEffect, useState } from "react";
import { AdminPage, Field, TextInput, apiCall } from "@/admin/components/AdminUI";
import { api, formatApiError } from "@/lib/api";
import { resetImageAssetsCache } from "@/hooks/useImageAssets";

/**
 * Image Management — admin curates the public site's image slots.
 * Each slot exposes: preview, recommended dimensions, aspect ratio, usage note,
 * AR/EN alt text, active toggle, URL replacement (paste URL or upload file).
 */
export default function ImagesAdmin() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [msg, setMsg] = useState("");
  const [drafts, setDrafts] = useState({}); // slot_key → partial overrides

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
      setMsg(`Saved “${key}” ✓ — refresh the public site to see updates.`);
      setTimeout(() => setMsg(""), 3500);
    } else {
      setMsg(`Error saving ${key}: ${r.error}`);
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
      setMsg(`Upload error: ${formatApiError(e.response?.data?.detail) || e.message}`);
    }
  }

  if (loading) return <div className="p-10 text-mute">Loading…</div>;

  return (
    <AdminPage
      title="Image Management"
      subtitle="Public site imagery · Theme B"
    >
      <p className="max-w-[760px] text-[14px] text-ink/75 leading-relaxed mb-10">
        Manage the curated images used across the public site. Each slot has a recommended size and aspect ratio so designers can prepare assets correctly. Replace the URL or upload a new file. Toggle a slot off to hide its image (the section will fall back to its solid background).
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
              {/* Preview */}
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
                  aria-label={merged[`alt_en`] || slot.title_en}
                  data-testid={`image-preview-${slot.slot_key}`}
                />
                <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-mute">
                  {slot.recommended_width} × {slot.recommended_height}px
                  {slot.aspect_ratio && <span className="ms-2 text-brass font-semibold">{slot.aspect_ratio}</span>}
                </div>
              </div>

              {/* Editor */}
              <div className="lg:col-span-8 space-y-4">
                <header className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-brass font-semibold">{slot.slot_key}</div>
                    <h3 className="text-[18px] font-medium text-navy-deep mt-1">{slot.title_en}</h3>
                    <h4 className="text-[14.5px] text-ink/75" dir="rtl" style={{ fontFamily: '"Thmanyah Sans", sans-serif' }}>{slot.title_ar}</h4>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-[13px]" data-testid={`image-active-${slot.slot_key}`}>
                    <input
                      type="checkbox"
                      checked={merged.active !== false}
                      onChange={(e) => patchDraft(slot.slot_key, { active: e.target.checked })}
                    />
                    <span>{merged.active !== false ? "Active" : "Inactive"}</span>
                  </label>
                </header>

                <div className="text-[13px] text-mute leading-relaxed">
                  <strong className="text-navy-deep">Usage:</strong> {slot.usage_note_en}
                  <br />
                  <span dir="rtl" style={{ fontFamily: '"Thmanyah Sans", sans-serif' }}>{slot.usage_note_ar}</span>
                </div>

                <Field label="Image URL" hint="Paste a hosted URL or upload below">
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
                  <Field label="Alt text · Arabic" dir="rtl">
                    <TextInput value={merged.alt_ar || ""} onChange={(v) => patchDraft(slot.slot_key, { alt_ar: v })} testid={`alt-ar-${slot.slot_key}`} />
                  </Field>
                  <Field label="Alt text · English">
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
                    {savingKey === slot.slot_key ? "Saving…" : (dirty ? "Save changes" : "No changes")}
                  </button>
                  {dirty && (
                    <button
                      type="button"
                      onClick={() => setDrafts((d) => { const n = { ...d }; delete n[slot.slot_key]; return n; })}
                      className="text-[13px] text-mute hover:text-navy underline underline-offset-4"
                      data-testid={`image-cancel-${slot.slot_key}`}
                    >
                      Discard
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

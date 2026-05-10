import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Film, Upload, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AdminPage, Field, TextInput, apiCall } from "@/admin/components/AdminUI";
import { useLang } from "@/i18n/LanguageContext";
import { api, formatApiError } from "@/lib/api";
import { resetImageAssetsCache } from "@/hooks/useImageAssets";
import { HeroMediaSection } from "@/admin/pages/HeroMediaAdmin";

const TABS = [
  { key: "hero",   icon: Film,      labelAr: "خلفيات رؤوس الصفحات",   labelEn: "Page hero backgrounds",
    helpAr: "صور سينمائية كاملة العرض تظهر خلف الهيدر في كل صفحة (الرئيسية، الإصدارات…). تحكم في نقطة التركيز ودرجة التعتيم.",
    helpEn: "Cinematic full-bleed images that sit behind the header on each page (Home, Publications…). Control focal point + overlay." },
  { key: "assets", icon: ImageIcon, labelAr: "صور الأقسام والعناصر",  labelEn: "Section assets",
    helpAr: "صور المنسّقة المستخدمة داخل الأقسام (مثل صورة قسم «عن المركز»). كل خانة لها مقاس مفضّل ونقطة تركيز قابلة للتعديل.",
    helpEn: "Curated images used inside content sections (e.g. About). Each slot has a recommended size and an editable focal point." },
];

/**
 * Slots that are now managed in /admin/home (per-section image controls).
 * Hidden from this page to avoid duplication and confusion. The data still
 * exists in the DB (image_assets collection) for backward compatibility.
 */
const HOME_MANAGED_SLOTS = new Set([
  "about_image",
  "objectives_background",
  "foundations_background",
  "fields_of_work_background",
  "library_background",
]);

/**
 * Hero page_keys that are now managed elsewhere.
 *  - "home" → managed in /admin/home (Hero card)
 */
const HOME_MANAGED_PAGE_KEYS = new Set(["home"]);

export default function ImagesAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const [tab, setTab] = useState("hero");
  const active = TABS.find((t) => t.key === tab);

  return (
    <AdminPage
      title={tr("إدارة الصور", "Image Management")}
      subtitle={tr("كل صور الموقع العام في مكان واحد", "All public-site imagery in one place")}
      helpAr="هذه الصفحة تجمع كل التحكّم في صور الموقع: الخلفيات السينمائية لكل صفحة (Hero) + الصور داخل الأقسام. كل صورة تدعم اختيار نقطة التركيز عبر الضغط على المعاينة."
      helpEn="One unified page for all public-site imagery: cinematic page heroes + in-section images. Every image supports focal-point picking via the live preview."
    >
      {/* ---------- Tab nav ---------- */}
      <div role="tablist" aria-label="Image management tabs" className="flex items-stretch border-b border-rule mb-6" data-testid="images-admin-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setTab(t.key)}
              className={`group inline-flex items-center gap-2 px-5 py-3 text-[13.5px] -mb-px border-b-2 transition-colors ${
                isActive
                  ? "border-brass text-navy-deep"
                  : "border-transparent text-mute hover:text-navy-deep"
              }`}
              data-testid={`images-admin-tab-${t.key}`}
            >
              <Icon size={15} strokeWidth={1.7} />
              <span>{tr(t.labelAr, t.labelEn)}</span>
            </button>
          );
        })}
      </div>

      {/* Tab help banner */}
      {active && (
        <p className="text-[13px] text-mute mt-1 mb-6 max-w-[760px] leading-relaxed">
          {tr(active.helpAr, active.helpEn)}
        </p>
      )}

      {/* ---------- Tab panels ---------- */}
      {tab === "hero" ? (
        <div role="tabpanel" data-testid="images-admin-panel-hero"><HeroMediaSection /></div>
      ) : (
        <div role="tabpanel" data-testid="images-admin-panel-assets"><SectionAssetsPanel /></div>
      )}
    </AdminPage>
  );
}

/* ----------------------------------------------------------------------
 * Section Assets — formerly the standalone /admin/images content.
 * Adds a focal-point preview/picker so the editor can position the
 * subject of the image (e.g. for the About portrait).
 * ----------------------------------------------------------------------*/
function SectionAssetsPanel() {
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
    if (r.ok) setSlots((r.data?.items || []).filter((it) => !HOME_MANAGED_SLOTS.has(it.slot_key)));
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
      setMsg(tr(`تم حفظ "${key}" ✓ — التغييرات تطبق فوراً على الموقع.`, `Saved "${key}" ✓ — applied to the public site instantly.`));
      setTimeout(() => setMsg(""), 3500);
    } else {
      setMsg(`${tr("خطأ في حفظ", "Error saving")} ${key}: ${r.error}`);
    }
  }

  if (loading) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;
  if (!slots.length) return <div className="p-6 text-mute text-[13.5px]">{tr("لا توجد خانات صور حالياً.", "No image slots configured.")}</div>;

  return (
    <>
      {msg && (
        <div className="mb-6 px-4 py-3 border-l-2 border-brass bg-paper text-[13px]" data-testid="images-status">{msg}</div>
      )}
      <div className="space-y-6 max-w-[1200px]">
        {slots.map((slot) => (
          <SectionAssetCard
            key={slot.slot_key}
            slot={slot}
            draft={drafts[slot.slot_key] || {}}
            saving={savingKey === slot.slot_key}
            onPatchDraft={(p) => patchDraft(slot.slot_key, p)}
            onSave={() => saveSlot(slot.slot_key)}
            onDiscard={() => setDrafts((d) => { const n = { ...d }; delete n[slot.slot_key]; return n; })}
            tr={tr}
            lang={lang}
            onMsg={setMsg}
          />
        ))}
      </div>
    </>
  );
}

/* Per-slot card with focal-point live preview + safe-crop overlay */
function SectionAssetCard({ slot, draft, saving, onPatchDraft, onSave, onDiscard, tr, lang, onMsg }) {
  const fileRef = useRef(null);
  const [warn, setWarn] = useState(null);
  const [dims, setDims] = useState(null);
  const [uploading, setUploading] = useState(false);

  const merged = { ...slot, ...draft };
  const dirty = Object.keys(draft).length > 0;
  const fx = Math.max(0, Math.min(100, Number(merged.focal_x ?? 50)));
  const fy = Math.max(0, Math.min(100, Number(merged.focal_y ?? 50)));
  const aspect = (slot.recommended_width && slot.recommended_height)
    ? `${slot.recommended_width} / ${slot.recommended_height}`
    : "16 / 9";

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setWarn(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const img = new window.Image();
      img.onload = () => {
        setDims({ w: img.naturalWidth, h: img.naturalHeight });
        const minW = Math.min(slot.recommended_width || 1600, 1600);
        const minH = Math.min(slot.recommended_height || 900, 900);
        if (img.naturalWidth < minW || img.naturalHeight < minH) {
          setWarn(tr(
            `الصورة صغيرة (${img.naturalWidth}×${img.naturalHeight}). الموصى به ${slot.recommended_width || "—"}×${slot.recommended_height || "—"}.`,
            `Image is small (${img.naturalWidth}×${img.naturalHeight}). Recommended ${slot.recommended_width || "—"}×${slot.recommended_height || "—"}.`,
          ));
        }
      };
      img.src = data.url;
      onPatchDraft({ url: data.url });
    } catch (err) {
      onMsg(`${tr("خطأ في الرفع", "Upload error")}: ${formatApiError(err.response?.data?.detail) || err.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function onPreviewClick(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100);
    const y = Math.round(((e.clientY - r.top) / r.height) * 100);
    onPatchDraft({ focal_x: Math.max(0, Math.min(100, x)), focal_y: Math.max(0, Math.min(100, y)) });
  }

  return (
    <article
      className="border border-rule bg-white p-6 grid grid-cols-1 lg:grid-cols-12 gap-6"
      data-testid={`image-slot-${slot.slot_key}`}
      style={{ borderRadius: 12 }}
    >
      {/* Live preview */}
      <div className="lg:col-span-5">
        <div className="text-[11.5px] uppercase tracking-[0.18em] text-mute mb-2">
          {tr("المعاينة (اضغط لتحديد نقطة التركيز)", "Live preview — click to set focal point")}
        </div>
        <div
          onClick={merged.url ? onPreviewClick : undefined}
          className="relative w-full overflow-hidden border border-rule"
          style={{
            aspectRatio: aspect,
            background: merged.url ? "#0A111C" : "#EFEAE0",
            cursor: merged.url ? "crosshair" : "default",
            borderRadius: 8,
          }}
          role="img"
          aria-label={merged.alt_en || slot.title_en}
          data-testid={`image-preview-${slot.slot_key}`}
        >
          {merged.url ? (
            <>
              <img
                src={merged.url}
                alt=""
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: "cover", objectPosition: `${fx}% ${fy}%` }}
              />
              {/* Safe-crop guide */}
              <div
                aria-hidden
                className="absolute pointer-events-none"
                style={{ inset: 0, boxShadow: "inset 0 0 0 1px rgba(180,145,74,0.55)", margin: "12% 16%", borderRadius: 2 }}
                title={tr("منطقة العرض الآمنة", "Safe crop area")}
              />
              {/* Focal-point cross-hair */}
              <div
                aria-hidden
                className="absolute"
                style={{
                  left: `${fx}%`,
                  top: `${fy}%`,
                  width: 14,
                  height: 14,
                  transform: "translate(-50%,-50%)",
                  borderRadius: 9999,
                  background: "rgba(180,145,74,0.95)",
                  boxShadow: "0 0 0 3px rgba(255,255,255,0.85), 0 0 0 4px rgba(180,145,74,0.95)",
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[13px] text-mute">
              {tr("لا توجد صورة — استخدم الرفع", "No image — upload one")}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11.5px] text-mute flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: "rgba(180,145,74,0.95)" }} />
            {tr("نقطة التركيز", "Focal")}: {fx}% · {fy}%
          </span>
          {slot.recommended_width && (
            <span>
              {tr("الموصى به", "Recommended")}: {slot.recommended_width}×{slot.recommended_height}px
              {slot.aspect_ratio && <span className="ms-1 text-brass font-semibold">· {slot.aspect_ratio}</span>}
            </span>
          )}
          {dims && (
            <span className="inline-flex items-center gap-1.5">
              {dims.w >= (slot.recommended_width || 1600) && dims.h >= (slot.recommended_height || 900)
                ? <CheckCircle2 size={12} className="text-green-700" />
                : <AlertTriangle size={12} className="text-amber-600" />}
              {dims.w}×{dims.h}px
            </span>
          )}
        </div>
        {warn && (
          <div className="mt-2 inline-flex items-start gap-1.5 text-[11.5px] text-amber-700">
            <AlertTriangle size={12} className="mt-0.5" /> {warn}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="lg:col-span-7 space-y-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-brass font-semibold">{slot.slot_key}</div>
            <h3 className="text-[18px] font-medium text-navy-deep mt-1">{lang === "ar" ? slot.title_ar : slot.title_en}</h3>
            <h4 className="text-[13.5px] text-ink/65" dir={lang === "ar" ? "ltr" : "rtl"}>{lang === "ar" ? slot.title_en : slot.title_ar}</h4>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer text-[13px]" data-testid={`image-active-${slot.slot_key}`}>
            <input
              type="checkbox"
              checked={merged.active !== false}
              onChange={(e) => onPatchDraft({ active: e.target.checked })}
            />
            <span>{merged.active !== false ? tr("نشط", "Active") : tr("غير نشط", "Inactive")}</span>
          </label>
        </header>

        <div className="text-[12.5px] text-mute leading-relaxed border-s-2 border-brass ps-3 py-1">
          <strong className="text-navy-deep">{tr("الاستخدام:", "Usage:")}</strong> {lang === "ar" ? slot.usage_note_ar : slot.usage_note_en}
        </div>

        {/* URL + upload */}
        <Field label={tr("رابط الصورة", "Image URL")}>
          <div className="flex gap-2">
            <TextInput value={merged.url || ""} onChange={(v) => onPatchDraft({ url: v })} testid={`image-url-${slot.slot_key}`} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 h-10 px-3 border border-navy-deep text-[12.5px] text-navy-deep hover:bg-navy-deep hover:text-white transition-colors"
              data-testid={`image-upload-btn-${slot.slot_key}`}
            >
              <Upload size={13} /> {uploading ? tr("جارٍ الرفع…", "Uploading…") : tr("رفع", "Upload")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPickFile}
              data-testid={`image-upload-${slot.slot_key}`}
            />
          </div>
        </Field>

        {/* Focal sliders */}
        <div className="grid grid-cols-2 gap-3">
          <FocalSlider label={tr("التركيز ↔ (X)", "Focal X ↔")} value={fx} onChange={(v) => onPatchDraft({ focal_x: v })} testid={`focal-x-${slot.slot_key}`} />
          <FocalSlider label={tr("التركيز ↕ (Y)", "Focal Y ↕")} value={fy} onChange={(v) => onPatchDraft({ focal_y: v })} testid={`focal-y-${slot.slot_key}`} />
        </div>

        {/* Alt text */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={tr("النص البديل · العربية", "Alt · Arabic")} dir="rtl">
            <TextInput value={merged.alt_ar || ""} onChange={(v) => onPatchDraft({ alt_ar: v })} testid={`alt-ar-${slot.slot_key}`} />
          </Field>
          <Field label={tr("النص البديل · الإنجليزية", "Alt · English")}>
            <TextInput value={merged.alt_en || ""} onChange={(v) => onPatchDraft({ alt_en: v })} testid={`alt-en-${slot.slot_key}`} />
          </Field>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || saving}
            className={`px-4 py-2 text-[13px] ${dirty ? "bg-navy-deep text-white" : "bg-rule text-mute cursor-not-allowed"}`}
            style={{ borderRadius: 6 }}
            data-testid={`image-save-${slot.slot_key}`}
          >
            {saving ? tr("جارٍ الحفظ…", "Saving…") : (dirty ? tr("حفظ التغييرات", "Save changes") : tr("لا تغييرات", "No changes"))}
          </button>
          {dirty && (
            <button
              type="button"
              onClick={onDiscard}
              className="text-[13px] text-mute hover:text-navy underline underline-offset-4 inline-flex items-center gap-1"
              data-testid={`image-cancel-${slot.slot_key}`}
            >
              <Trash2 size={12} /> {tr("تجاهل", "Discard")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function FocalSlider({ label, value, onChange, testid }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[12.5px] text-navy-deep">{label}</label>
        <span className="text-[11.5px] text-mute tabular-nums">{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-brass cursor-pointer"
        data-testid={testid}
      />
    </div>
  );
}

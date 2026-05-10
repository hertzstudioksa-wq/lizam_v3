import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Image as ImageIcon, Trash2, Plus, Upload } from "lucide-react";
import {
  AdminPage, Field, TextArea, TextInput, Select, SaveBar, useDirtyForm, apiCall,
} from "@/admin/components/AdminUI";
import { ReorderControls, moveItem } from "@/admin/components/ReorderControls";
import { useLang } from "@/i18n/LanguageContext";
import { invalidateSiteCache } from "@/hooks/useSiteSettings";
import { api, formatApiError } from "@/lib/api";

// ---------------- Constants ----------------
// Order in this array is the DEFAULT order for the home page. The actual
// rendering order on both /admin/home and the public site is driven by
// `home_content.visible_sections` — see CSS `order` styles below.
const SECTIONS = [
  "hero", "about", "mission", "pull_band", "objectives",
  "fields_of_work", "featured_publications", "contact", "newsletter",
];

const arrToText = (arr) => (Array.isArray(arr) ? arr.filter(Boolean).join("\n") : "");
const textToArr = (txt) =>
  String(txt || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

const uid = () => `id_${Math.random().toString(36).slice(2, 10)}`;

// ---------------- Reusable section-level UI ----------------

/**
 * <SectionCard> — collapsible card with a header that contains:
 *  - section eyebrow (small caps)
 *  - section title
 *  - per-section visibility toggle (writes into visible_sections[])
 *  - collapse / expand chevron
 */
function SectionCard({
  id, title, eyebrow, children, defaultOpen = false,
  visibleSections, onToggleVisibility, hasVisibilityToggle = true,
  // Reorder controls (optional). When provided, ↑/↓ buttons render in the header.
  orderIndex, orderTotal, onMove,
  testid,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isVisible = visibleSections.includes(id);
  const hasReorder = typeof orderIndex === "number" && typeof orderTotal === "number" && typeof onMove === "function";
  const canMoveUp = hasReorder && orderIndex > 0;
  const canMoveDown = hasReorder && orderIndex < orderTotal - 1;
  return (
    <section
      className="border border-rule bg-white"
      style={{ order: hasReorder ? orderIndex : 999 }}
      data-testid={testid || `home-section-${id}`}
    >
      <header
        className="flex items-center gap-4 px-5 md:px-6 py-4 cursor-pointer select-none hover:bg-paper transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronDown
          size={18}
          className="text-mute shrink-0"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 200ms" }}
        />
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <div className="text-[10.5px] uppercase tracking-[0.22em] text-brass font-semibold mb-1">{eyebrow}</div>
          )}
          <div className="text-[15.5px] font-medium text-navy-deep truncate">{title}</div>
        </div>
        {hasReorder && (
          <div
            className="inline-flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => canMoveUp && onMove(orderIndex, orderIndex - 1)}
              disabled={!canMoveUp}
              className="w-7 h-7 inline-flex items-center justify-center text-mute hover:text-navy hover:bg-paper border border-rule disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="رفع لأعلى"
              data-testid={`section-move-up-${id}`}
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => canMoveDown && onMove(orderIndex, orderIndex + 1)}
              disabled={!canMoveDown}
              className="w-7 h-7 inline-flex items-center justify-center text-mute hover:text-navy hover:bg-paper border border-rule disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="نزول لأسفل"
              data-testid={`section-move-down-${id}`}
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}
        {hasVisibilityToggle && (
          <label
            className="inline-flex items-center gap-2 cursor-pointer shrink-0"
            onClick={(e) => e.stopPropagation()}
            title={isVisible ? "ظاهر للجمهور" : "مخفي عن الجمهور"}
          >
            <span className="text-[12px] text-mute min-w-[44px] text-end whitespace-nowrap">{isVisible ? "ظاهر" : "مخفي"}</span>
            <input
              type="checkbox"
              checked={isVisible}
              onChange={() => onToggleVisibility(id)}
              className="sr-only"
              data-testid={`section-visibility-${id}`}
            />
            <span className={`relative inline-block w-10 h-5 transition-colors ${isVisible ? "bg-navy" : "bg-rule"}`}>
              <span className={`block w-4 h-4 bg-white m-0.5 transition-transform ${isVisible ? "translate-x-5" : ""}`} />
            </span>
          </label>
        )}
      </header>
      {open && (
        <div className="px-5 md:px-7 pt-2 pb-7 border-t border-rule">{children}</div>
      )}
    </section>
  );
}

/**
 * <FontScaleSlider> — single slider that writes section_styles[sectionKey][styleKey].
 * Range: 0.8 → 1.5, step 0.05.
 */
function FontScaleSlider({ form, sectionKey, styleKey = "title_scale", labelAr, labelEn, sample, sampleSize = 24 }) {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const styles = form.value.section_styles || {};
  const sectionObj = styles[sectionKey] || {};
  const v = typeof sectionObj[styleKey] === "number" ? sectionObj[styleKey] : 1;
  const pct = Math.round(v * 100);
  const setVal = (n) => {
    const nv = Math.max(0.8, Math.min(1.5, n));
    const next = {
      ...styles,
      [sectionKey]: { ...sectionObj, [styleKey]: Math.round(nv * 100) / 100 },
    };
    form.patch("section_styles", next);
  };
  return (
    <div className="border border-rule bg-paper px-4 py-3.5" data-testid={`fs-${sectionKey}-${styleKey}`}>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-[12.5px] font-medium text-navy-deep">{tr(labelAr, labelEn)}</label>
        <span className="text-[11.5px] text-mute tabular-nums">{pct}%</span>
      </div>
      <input
        type="range"
        min={0.8}
        max={1.5}
        step="0.05"
        value={v}
        onChange={(e) => setVal(parseFloat(e.target.value))}
        className="w-full accent-brass cursor-pointer"
        data-testid={`fs-${sectionKey}-${styleKey}-slider`}
      />
      <div className="flex items-center justify-between gap-2 text-[11px] text-mute mt-1.5">
        <button type="button" onClick={() => setVal(1)} className="hover:text-navy underline underline-offset-2">
          {tr("إعادة إلى 100%", "Reset to 100%")}
        </button>
        <span className="opacity-70">80% – 150%</span>
      </div>
      {sample && (
        <div className="mt-2 px-3 py-2 bg-white border border-rule" dir={lang === "ar" ? "rtl" : "ltr"}>
          <span style={{ fontSize: sampleSize * v, fontFamily: '"Thmanyah Serif Display", serif', color: "var(--lz-navy)" }}>
            {sample}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * <ImageUploader> — small block with current image preview, "Upload" and
 * "Clear" buttons. Writes the resulting URL via `onChange(url)`.
 * Uses POST /uploads/image (already existing endpoint).
 */
function ImageUploader({ value, onChange, label, testid, hint }) {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.url);
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail) || e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-rule bg-white p-4" data-testid={testid}>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <span className="text-[13px] font-medium text-navy-deep">{label}</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[11.5px] text-red-700 hover:text-red-900 inline-flex items-center gap-1"
            data-testid={`${testid}-clear`}
          >
            <Trash2 size={11} /> {tr("إزالة", "Remove")}
          </button>
        )}
      </div>
      {value ? (
        <div className="aspect-[16/9] bg-paper border border-rule overflow-hidden">
          <img src={value} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-paper border border-dashed border-rule flex items-center justify-center text-mute">
          <ImageIcon size={32} strokeWidth={1.4} />
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => upload(e.target.files?.[0])}
          className="sr-only"
          data-testid={`${testid}-input`}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="lz-btn-ghost inline-flex items-center gap-1.5 disabled:opacity-50"
          data-testid={`${testid}-upload`}
        >
          <Upload size={13} />
          <span>{busy ? tr("جارٍ الرفع…", "Uploading…") : tr("رفع صورة", "Upload image")}</span>
        </button>
        <TextInput
          value={value || ""}
          onChange={onChange}
          placeholder={tr("أو ألصق رابط مباشر", "Or paste a direct URL")}
          testid={`${testid}-url`}
        />
      </div>
      {hint && <p className="mt-2 text-[11.5px] text-mute">{hint}</p>}
      {err && <p className="mt-2 text-[12px] text-red-700">{err}</p>}
    </div>
  );
}

/**
 * <BgImageBlock> — full per-section background editor.
 * Reads/writes `home_content.section_styles[sectionKey].bg = {url, focal_x,
 * focal_y, overlay_opacity, alt_ar, alt_en, enabled}`.
 *
 * Includes: enable toggle, image upload + URL paste, focal-point picker
 * (click on preview to set), overlay opacity slider, AR/EN alt text.
 */
function BgImageBlock({ form, sectionKey, defaultOverlay = 0.5, label }) {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const styles = form.value.section_styles || {};
  const sectionObj = styles[sectionKey] || {};
  const bg = sectionObj.bg || {};
  const enabled = bg.enabled !== false;
  const url = bg.url || "";
  const fx = typeof bg.focal_x === "number" ? bg.focal_x : 50;
  const fy = typeof bg.focal_y === "number" ? bg.focal_y : 50;
  const opacity = typeof bg.overlay_opacity === "number" ? bg.overlay_opacity : defaultOverlay;
  const altAr = bg.alt_ar || "";
  const altEn = bg.alt_en || "";

  const writeBg = (patch) => {
    const next = {
      ...styles,
      [sectionKey]: {
        ...sectionObj,
        bg: { ...bg, ...patch },
      },
    };
    form.patch("section_styles", next);
  };

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      writeBg({ url: data.url });
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail) || e.message);
    } finally {
      setBusy(false);
    }
  }

  function onPreviewClick(e) {
    if (!url) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100);
    const y = Math.round(((e.clientY - r.top) / r.height) * 100);
    writeBg({ focal_x: Math.max(0, Math.min(100, x)), focal_y: Math.max(0, Math.min(100, y)) });
  }

  return (
    <div className="border border-rule bg-white p-5" data-testid={`bg-block-${sectionKey}`}>
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <span className="text-[13.5px] font-medium text-navy-deep">{label || tr("صورة الخلفية", "Background image")}</span>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <span className="text-[12px] text-mute">{enabled ? tr("مفعّل", "Enabled") : tr("معطّل", "Disabled")}</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={() => writeBg({ enabled: !enabled })}
            className="sr-only"
            data-testid={`bg-${sectionKey}-toggle`}
          />
          <span className={`relative inline-block w-10 h-5 transition-colors ${enabled ? "bg-navy" : "bg-rule"}`}>
            <span className={`block w-4 h-4 bg-white m-0.5 transition-transform ${enabled ? "translate-x-5" : ""}`} />
          </span>
        </label>
      </div>

      {/* Preview / focal-picker */}
      {url ? (
        <button
          type="button"
          onClick={onPreviewClick}
          className="relative block w-full aspect-[16/9] bg-paper border border-rule overflow-hidden cursor-crosshair"
          title={tr("اضغط لتحديد نقطة التركيز", "Click to set focal point")}
          data-testid={`bg-${sectionKey}-preview`}
        >
          <img src={url} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover", objectPosition: `${fx}% ${fy}%` }} />
          {/* Overlay preview */}
          <span aria-hidden className="absolute inset-0" style={{ background: `rgba(10,17,28,${opacity})` }} />
          {/* Focal crosshair */}
          <span aria-hidden className="absolute" style={{
            left: `${fx}%`, top: `${fy}%`, width: 22, height: 22, marginLeft: -11, marginTop: -11,
            border: "2px solid #fff", borderRadius: "50%", boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }} />
        </button>
      ) : (
        <div className="aspect-[16/9] bg-paper border border-dashed border-rule flex items-center justify-center text-mute">
          <ImageIcon size={32} strokeWidth={1.4} />
        </div>
      )}

      {/* Upload + URL */}
      <div className="mt-3 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => upload(e.target.files?.[0])}
          className="sr-only"
          data-testid={`bg-${sectionKey}-input`}
        />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="lz-btn-ghost inline-flex items-center gap-1.5 disabled:opacity-50">
          <Upload size={13} />
          <span>{busy ? tr("جارٍ الرفع…", "Uploading…") : tr("رفع", "Upload")}</span>
        </button>
        <TextInput
          value={url}
          onChange={(v) => writeBg({ url: v })}
          placeholder={tr("أو ألصق رابط مباشر", "Or paste a direct URL")}
          testid={`bg-${sectionKey}-url`}
        />
        {url && (
          <button type="button" onClick={() => writeBg({ url: "" })} className="text-[11.5px] text-red-700 hover:text-red-900 inline-flex items-center gap-1">
            <Trash2 size={11} /> {tr("إزالة", "Remove")}
          </button>
        )}
      </div>

      {err && <p className="mt-2 text-[12px] text-red-700">{err}</p>}

      {/* Focal X/Y + overlay opacity sliders */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="text-[12px] text-navy-deep">{tr("تركيز أفقي (X)", "Focal X")}</label>
            <span className="text-[11px] text-mute tabular-nums">{fx}%</span>
          </div>
          <input type="range" min={0} max={100} value={fx} onChange={(e) => writeBg({ focal_x: parseInt(e.target.value, 10) })}
            className="w-full accent-brass" data-testid={`bg-${sectionKey}-fx`} />
        </div>
        <div className="md:col-span-1">
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="text-[12px] text-navy-deep">{tr("تركيز عمودي (Y)", "Focal Y")}</label>
            <span className="text-[11px] text-mute tabular-nums">{fy}%</span>
          </div>
          <input type="range" min={0} max={100} value={fy} onChange={(e) => writeBg({ focal_y: parseInt(e.target.value, 10) })}
            className="w-full accent-brass" data-testid={`bg-${sectionKey}-fy`} />
        </div>
        <div className="md:col-span-1">
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="text-[12px] text-navy-deep">{tr("تعتيم الخلفية", "Overlay opacity")}</label>
            <span className="text-[11px] text-mute tabular-nums">{Math.round(opacity * 100)}%</span>
          </div>
          <input type="range" min={0} max={1} step="0.05" value={opacity} onChange={(e) => writeBg({ overlay_opacity: parseFloat(e.target.value) })}
            className="w-full accent-brass" data-testid={`bg-${sectionKey}-opacity`} />
        </div>
      </div>

      {/* Alt text */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label={tr("النص البديل (عربي)", "Alt text (AR)")}>
          <TextInput value={altAr} onChange={(v) => writeBg({ alt_ar: v })} dir="rtl" testid={`bg-${sectionKey}-alt-ar`} />
        </Field>
        <Field label={tr("النص البديل (إنجليزي)", "Alt text (EN)")}>
          <TextInput value={altEn} onChange={(v) => writeBg({ alt_en: v })} testid={`bg-${sectionKey}-alt-en`} />
        </Field>
      </div>
    </div>
  );
}

/**
 * <FieldTypoControls> — inline typography controls (size + weight + color)
 * for a single text field. Writes/reads from:
 *   home_content.section_styles[sectionKey].text_styles[fieldKey]
 *     = { size: number (0.8–2.0), weight: number (300|400|500|600|700), color: string }
 *
 * Defaults: size=1, weight="" (inherit), color="" (inherit). Empty values
 * fall back to the theme's CSS so existing pages aren't affected.
 */
function FieldTypoControls({ form, sectionKey, fieldKey, testid }) {
  const styles = form.value.section_styles || {};
  const sectionObj = styles[sectionKey] || {};
  const textStyles = sectionObj.text_styles || {};
  const cur = textStyles[fieldKey] || {};
  const size = typeof cur.size === "number" ? cur.size : 1;
  const weight = cur.weight || "";
  const color = cur.color || "";

  const write = (patch) => {
    const next = {
      ...styles,
      [sectionKey]: {
        ...sectionObj,
        text_styles: {
          ...textStyles,
          [fieldKey]: { ...cur, ...patch },
        },
      },
    };
    form.patch("section_styles", next);
  };

  const pct = Math.round(size * 100);
  const reset = () => write({ size: 1, weight: "", color: "" });
  const tid = testid || `typo-${sectionKey}-${fieldKey}`;

  return (
    <div className="border border-rule bg-paper px-3 py-2.5 mb-2" data-testid={tid}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Size slider */}
        <div className="flex items-center gap-2 min-w-[180px] flex-1">
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-mute shrink-0">حجم</span>
          <input
            type="range"
            min={0.8}
            max={2.0}
            step="0.05"
            value={size}
            onChange={(e) => write({ size: parseFloat(e.target.value) })}
            className="flex-1 accent-brass cursor-pointer"
            data-testid={`${tid}-size`}
          />
          <span className="text-[11px] text-mute tabular-nums w-10 text-end">{pct}%</span>
        </div>

        {/* Weight selector */}
        <label className="flex items-center gap-2 shrink-0">
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-mute">سماكة</span>
          <select
            value={weight}
            onChange={(e) => write({ weight: e.target.value })}
            className="h-7 text-[12px] border border-rule px-2 bg-white"
            data-testid={`${tid}-weight`}
          >
            <option value="">افتراضي</option>
            <option value="300">رفيع (300)</option>
            <option value="400">عادي (400)</option>
            <option value="500">متوسط (500)</option>
            <option value="600">سميك (600)</option>
            <option value="700">عريض (700)</option>
          </select>
        </label>

        {/* Color picker */}
        <label className="flex items-center gap-2 shrink-0">
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-mute">لون</span>
          <input
            type="color"
            value={color || "#0A111C"}
            onChange={(e) => write({ color: e.target.value })}
            className="w-7 h-7 border border-rule cursor-pointer bg-white"
            data-testid={`${tid}-color`}
          />
          {color && (
            <button
              type="button"
              onClick={() => write({ color: "" })}
              className="text-[10.5px] text-mute hover:text-red-700 underline underline-offset-2"
              title="إزالة اللون المخصص"
              data-testid={`${tid}-color-clear`}
            >
              مسح
            </button>
          )}
        </label>

        {/* Reset all */}
        <button
          type="button"
          onClick={reset}
          className="text-[11px] text-mute hover:text-navy underline underline-offset-2 ms-auto"
          data-testid={`${tid}-reset`}
        >
          إعادة الكل
        </button>
      </div>
    </div>
  );
}

/** Pair of AR/EN inputs in a 2-col grid. */
function BiInput({ form, keyAr, keyEn, labelAr, labelEn, multiline = false, rows = 3, testid, sectionKey, fieldKey }) {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const Cmp = multiline ? TextArea : TextInput;
  const showTypo = sectionKey && fieldKey;
  return (
    <div>
      {showTypo && (
        <FieldTypoControls form={form} sectionKey={sectionKey} fieldKey={fieldKey} testid={`typo-${testid}`} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Field label={`${tr(labelAr, labelEn)} — ${tr("عربية", "AR")}`}>
          <Cmp
            value={form.value[keyAr] || ""}
            onChange={(v) => form.patch(keyAr, v)}
            dir="rtl"
            rows={rows}
            testid={`${testid}-ar`}
          />
        </Field>
        <Field label={`${tr(labelAr, labelEn)} — EN`}>
          <Cmp
            value={form.value[keyEn] || ""}
            onChange={(v) => form.patch(keyEn, v)}
            rows={rows}
            testid={`${testid}-en`}
          />
        </Field>
      </div>
    </div>
  );
}

/** Bilingual textarea pair for "one item per line" lists. */
function BiList({ form, keyAr, keyEn, labelAr, labelEn, testid }) {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Field label={`${tr(labelAr, labelEn)} — ${tr("عربية (نقطة في كل سطر)", "AR (one per line)")}`}>
        <TextArea
          value={arrToText(form.value[keyAr])}
          onChange={(v) => form.patch(keyAr, textToArr(v))}
          dir="rtl"
          rows={5}
          testid={`${testid}-ar`}
        />
      </Field>
      <Field label={`${tr(labelAr, labelEn)} — ${tr("إنجليزية (نقطة في كل سطر)", "EN (one per line)")}`}>
        <TextArea
          value={arrToText(form.value[keyEn])}
          onChange={(v) => form.patch(keyEn, textToArr(v))}
          rows={5}
          testid={`${testid}-en`}
        />
      </Field>
    </div>
  );
}

// ============================================================================
// Main page
// ============================================================================

export default function HomeAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
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

  // Visibility helpers (single source of truth: visible_sections[])
  const visible = form.value.visible_sections || [];
  const toggleVisibility = (id) => {
    const next = visible.includes(id) ? visible.filter((s) => s !== id) : [...visible, id];
    form.patch("visible_sections", next);
  };

  // Section ordering helpers — each section knows its index in visible_sections
  // and can move itself up/down via the chevron buttons in its own header.
  const moveSection = (from, to) => form.patch("visible_sections", moveItem(visible, from, to));
  // Compute (orderIndex, orderTotal) for any section so its header can render
  // ↑/↓ buttons. Hidden sections are excluded from ordering (they keep their
  // position when re-enabled).
  const orderInfo = (sectionId) => {
    const i = visible.indexOf(sectionId);
    return { orderIndex: i >= 0 ? i : undefined, orderTotal: visible.length };
  };
  const SECTION_LABELS_AR = {
    hero: "البطل (Hero)",
    about: "عن المركز",
    mission: "الرسالة",
    vision: "الرؤية",
    pull_band: "ركيزة عمل المركز",
    objectives: "الأهداف",
    fields_of_work: "مجالات العمل",
    featured_publications: "الإصدارات المميزة",
    contact: "التواصل",
    newsletter: "النشرة البريدية",
  };
  const SECTION_LABELS_EN = {
    hero: "Hero",
    about: "About",
    mission: "Mission",
    vision: "Vision",
    pull_band: "Working principle",
    objectives: "Objectives",
    fields_of_work: "Fields of work",
    featured_publications: "Featured publications",
    contact: "Contact",
    newsletter: "Newsletter",
  };
  const sectionLabel = (k) => (lang === "ar" ? SECTION_LABELS_AR[k] : SECTION_LABELS_EN[k]) || k;
  const hidden = SECTIONS.filter((s) => !visible.includes(s));

  // Objectives — full inline editing + reorder + add/remove
  const objectives = form.value.objectives || [];
  const moveObjective = (from, to) => form.patch("objectives", moveItem(objectives, from, to));
  const updateObjective = (idx, patch) => {
    form.patch("objectives", objectives.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  };
  const addObjective = () => {
    form.patch("objectives", [
      ...objectives,
      { id: uid(), title_ar: "", title_en: "", description_ar: "", description_en: "" },
    ]);
  };
  const removeObjective = (idx) => {
    form.patch("objectives", objectives.filter((_, i) => i !== idx));
  };

  // Fields of work — same shape as objectives but with optional icon
  const fields = form.value.fields_of_work || [];
  const moveField = (from, to) => form.patch("fields_of_work", moveItem(fields, from, to));
  const updateField = (idx, patch) => {
    form.patch("fields_of_work", fields.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  };
  const addField = () => {
    form.patch("fields_of_work", [
      ...fields,
      { id: uid(), title_ar: "", title_en: "", description_ar: "", description_en: "", icon: "compass" },
    ]);
  };
  const removeField = (idx) => {
    form.patch("fields_of_work", fields.filter((_, i) => i !== idx));
  };

  return (
    <AdminPage
      title={tr("محتوى الصفحة الرئيسية", "Home Page Content")}
      subtitle={tr("داش بورد كامل — قسم بقسم", "Full dashboard — section by section")}
      helpAr={"كل قسم في بطاقة منفصلة. اضغط على رأس البطاقة للفتح/الإغلاق. التحكم في الإظهار/الإخفاء، النصوص، حجم الخط، والصور — كل شيء فورياً على الحفظ."}
      helpEn={"Each section lives in its own collapsible card. Toggle visibility, edit copy, tweak per-section font scale, and upload images. Save reflects publicly within seconds."}
    >
      <div className="max-w-[1180px] flex flex-col gap-6">

        {/* ============================================================ */}
        {/* 1. HERO                                                        */}
        {/* ============================================================ */}
        <SectionCard id="hero" title={tr("قسم البطل (Hero)", "Hero")}
          eyebrow={tr("١", "1")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("hero")} onMove={moveSection}>
          <div className="mt-4 mb-3 px-3 py-2 bg-amber-50/50 border-s-2 border-brass text-[12px] text-navy-deep" data-testid="hero-typo-hint">
            {tr(
              "تحكم دقيق بكل صندوق نص: حجم الخط، السماكة، واللون — متاح الآن لقسم البطل. لو النتيجة تعجبك سأعمّمها على باقي الأقسام.",
              "Per-field typography control (size · weight · color) — now live for the Hero section. If you approve, I'll roll it out to the rest."
            )}
          </div>
          <div>
            <FieldTypoControls form={form} sectionKey="hero" fieldKey="eyebrow" testid="typo-hero-eyebrow" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Field label={tr("التسمية الصغيرة (eyebrow) — عربية", "Eyebrow AR")}>
                <TextInput value={form.value.hero_eyebrow_ar || ""} onChange={(v) => form.patch("hero_eyebrow_ar", v)} dir="rtl" testid="hero-eyebrow-ar" />
              </Field>
              <Field label={tr("التسمية الصغيرة — إنجليزية", "Eyebrow EN")}>
                <TextInput value={form.value.hero_eyebrow_en || ""} onChange={(v) => form.patch("hero_eyebrow_en", v)} testid="hero-eyebrow-en" />
              </Field>
            </div>
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="hero_title_ar" keyEn="hero_title_en"
              labelAr="العنوان الرئيسي (استخدم \\n لفاصل سطر)" labelEn="Main title (use \\n for line break)"
              multiline rows={2} testid="hero-title"
              sectionKey="hero" fieldKey="title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="hero_subtitle_ar" keyEn="hero_subtitle_en"
              labelAr="النص التعريفي / الفرعي" labelEn="Subtitle / lede"
              multiline rows={3} testid="hero-subtitle"
              sectionKey="hero" fieldKey="subtitle" />
          </div>
          {/* Buttons */}
          <h4 className="mt-6 mb-3 text-[12.5px] uppercase tracking-[0.16em] text-mute">{tr("الأزرار", "Buttons")}</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-rule bg-paper p-4">
              <div className="text-[12px] font-medium text-navy-deep mb-2">{tr("الزر الرئيسي", "Primary button")}</div>
              <FieldTypoControls form={form} sectionKey="hero" fieldKey="cta_primary" testid="typo-hero-cta-primary" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Field label={tr("نص الزر — عربية", "Label AR")}>
                  <TextInput value={form.value.hero_cta_primary_ar || ""} onChange={(v) => form.patch("hero_cta_primary_ar", v)} dir="rtl" testid="hero-cta1-ar" />
                </Field>
                <Field label={tr("نص الزر — إنجليزية", "Label EN")}>
                  <TextInput value={form.value.hero_cta_primary_en || ""} onChange={(v) => form.patch("hero_cta_primary_en", v)} testid="hero-cta1-en" />
                </Field>
              </div>
              <Field label={tr("الرابط (URL أو #anchor)", "Link (URL or #anchor)")}>
                <TextInput value={form.value.hero_cta_primary_link || ""} onChange={(v) => form.patch("hero_cta_primary_link", v)}
                  placeholder="/publications أو #publications" testid="hero-cta1-link" />
              </Field>
            </div>
            <div className="border border-rule bg-paper p-4">
              <div className="text-[12px] font-medium text-navy-deep mb-2">{tr("الزر الثانوي", "Secondary button")}</div>
              <FieldTypoControls form={form} sectionKey="hero" fieldKey="cta_secondary" testid="typo-hero-cta-secondary" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Field label={tr("نص الزر — عربية", "Label AR")}>
                  <TextInput value={form.value.hero_cta_secondary_ar || ""} onChange={(v) => form.patch("hero_cta_secondary_ar", v)} dir="rtl" testid="hero-cta2-ar" />
                </Field>
                <Field label={tr("نص الزر — إنجليزية", "Label EN")}>
                  <TextInput value={form.value.hero_cta_secondary_en || ""} onChange={(v) => form.patch("hero_cta_secondary_en", v)} testid="hero-cta2-en" />
                </Field>
              </div>
              <Field label={tr("الرابط", "Link")}>
                <TextInput value={form.value.hero_cta_secondary_link || ""} onChange={(v) => form.patch("hero_cta_secondary_link", v)}
                  placeholder="/about أو #about" testid="hero-cta2-link" />
              </Field>
            </div>
          </div>
          {/* Background media + font scale */}
          <h4 className="mt-6 mb-3 text-[12.5px] uppercase tracking-[0.16em] text-mute">{tr("الخلفية وحجم الخط", "Background & typography")}</h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2">
              <BgImageBlock form={form} sectionKey="hero" defaultOverlay={0.65}
                label={tr("صورة خلفية البطل", "Hero background image")} />
            </div>
            <div className="space-y-3">
              <FontScaleSlider form={form} sectionKey="hero" styleKey="title_scale"
                labelAr="حجم خط العنوان الرئيسي" labelEn="Main title font size"
                sample={tr("بحث قانوني رصين", "Rigorous legal research")} sampleSize={36} />
            </div>
          </div>
        </SectionCard>

        {/* ============================================================ */}
        {/* 2. ABOUT                                                       */}
        {/* ============================================================ */}
        <SectionCard id="about" title={tr("عن المركز", "About the Center")}
          eyebrow={tr("٢", "2")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("about")} onMove={moveSection}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
            <Field label={tr("التسمية الصغيرة — عربية", "Eyebrow AR")}>
              <TextInput value={form.value.about_eyebrow_ar || ""} onChange={(v) => form.patch("about_eyebrow_ar", v)} dir="rtl" testid="about-eyebrow-ar" />
            </Field>
            <Field label={tr("التسمية الصغيرة — إنجليزية", "Eyebrow EN")}>
              <TextInput value={form.value.about_eyebrow_en || ""} onChange={(v) => form.patch("about_eyebrow_en", v)} testid="about-eyebrow-en" />
            </Field>
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="about_ar" keyEn="about_en"
              labelAr="النص الرئيسي" labelEn="Main copy"
              multiline rows={5} testid="about-main" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="about_extended_ar" keyEn="about_extended_en"
              labelAr="تفاصيل إضافية" labelEn="Extended details"
              multiline rows={4} testid="about-ext" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
            <div className="lg:col-span-2">
              <BgImageBlock form={form} sectionKey="about" defaultOverlay={0}
                label={tr("صورة جانبية للقسم", "Section side image")} />
            </div>
            <div className="space-y-3">
              <FontScaleSlider form={form} sectionKey="about" styleKey="title_scale"
                labelAr="حجم خط العنوان" labelEn="Heading scale"
                sample={tr("عن المركز", "About the Center")} sampleSize={28} />
            </div>
          </div>
        </SectionCard>

        {/* ============================================================ */}
        {/* 3. MISSION & VISION                                            */}
        {/* ============================================================ */}
        <SectionCard id="mission" title={tr("الرسالة والرؤية (المنطلقات)", "Mission & Vision (Foundations)")}
          eyebrow={tr("٣", "3")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("mission")} onMove={moveSection}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
            <Field label={tr("التسمية الصغيرة — عربية", "Eyebrow AR")}>
              <TextInput value={form.value.mission_eyebrow_ar || ""} onChange={(v) => form.patch("mission_eyebrow_ar", v)} dir="rtl" testid="mission-eyebrow-ar" />
            </Field>
            <Field label={tr("التسمية الصغيرة — إنجليزية", "Eyebrow EN")}>
              <TextInput value={form.value.mission_eyebrow_en || ""} onChange={(v) => form.patch("mission_eyebrow_en", v)} testid="mission-eyebrow-en" />
            </Field>
          </div>

          <h4 className="mt-6 mb-2 text-[12.5px] uppercase tracking-[0.16em] text-brass">{tr("الرسالة", "Mission")}</h4>
          <BiInput form={form} keyAr="mission_ar" keyEn="mission_en"
            labelAr="نص الرسالة" labelEn="Mission statement"
            multiline rows={4} testid="mission-text" />
          <div className="mt-3">
            <BiList form={form} keyAr="mission_points_ar" keyEn="mission_points_en"
              labelAr="نقاط الرسالة" labelEn="Mission points" testid="mission-points" />
          </div>

          <h4 className="mt-7 mb-2 text-[12.5px] uppercase tracking-[0.16em] text-brass">{tr("الرؤية", "Vision")}</h4>
          <BiInput form={form} keyAr="vision_ar" keyEn="vision_en"
            labelAr="نص الرؤية" labelEn="Vision statement"
            multiline rows={4} testid="vision-text" />
          <div className="mt-3">
            <BiList form={form} keyAr="vision_points_ar" keyEn="vision_points_en"
              labelAr="نقاط الرؤية" labelEn="Vision points" testid="vision-points" />
          </div>

          <div className="mt-6 max-w-[420px]">
            <FontScaleSlider form={form} sectionKey="mission" styleKey="title_scale"
              labelAr="حجم خط عناوين الرسالة والرؤية" labelEn="Mission/Vision heading scale"
              sample={tr("الرسالة", "Mission")} sampleSize={24} />
          </div>
          <div className="mt-5">
            <BgImageBlock form={form} sectionKey="mission" defaultOverlay={0}
              label={tr("صورة خلفية القسم (اختيارية)", "Section background (optional)")} />
          </div>
        </SectionCard>

        {/* ============================================================ */}
        {/* 3.5 PULL BAND ("ركيزة عمل المركز")                              */}
        {/* ============================================================ */}
        <SectionCard id="pull_band" title={tr("ركيزة عمل المركز", "Working principle (Pull band)")}
          eyebrow={tr("٣.٥", "3.5")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("pull_band")} onMove={moveSection}>
          <p className="text-[12.5px] text-mute mt-2 max-w-[64ch]">
            {tr(
              "اقتباس مؤسسي يفصل بين قسم المنطلقات وقسم الأهداف. يُعرض على خلفية ورقية دافئة ويتوسطه نص تحريري قصير.",
              "An institutional pull-quote band that separates Foundations from Objectives. Renders centered on a warm paper background.",
            )}
          </p>
          <div className="mt-5">
            <BiInput form={form} keyAr="pull_band_text_ar" keyEn="pull_band_text_en"
              labelAr="نص الاقتباس" labelEn="Pull-quote text"
              multiline rows={4} testid="pullband-text" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="pull_band_attribution_ar" keyEn="pull_band_attribution_en"
              labelAr="التعريف (تحت النص)" labelEn="Attribution (below)"
              testid="pullband-attribution" />
          </div>
          <div className="mt-5 max-w-[420px]">
            <FontScaleSlider form={form} sectionKey="pull_band" styleKey="title_scale"
              labelAr="حجم خط الاقتباس" labelEn="Quote font size"
              sample={tr("نقدّم بحثاً قانونياً مستقلاً", "Independent legal research")} sampleSize={28} />
          </div>
        </SectionCard>

        {/* ============================================================ */}
        {/* 4. OBJECTIVES                                                  */}
        {/* ============================================================ */}
        <SectionCard id="objectives" title={tr("الأهداف", "Objectives")}
          eyebrow={tr("٤", "4")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("objectives")} onMove={moveSection}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
            <Field label={tr("التسمية الصغيرة — عربية", "Eyebrow AR")}>
              <TextInput value={form.value.objectives_eyebrow_ar || ""} onChange={(v) => form.patch("objectives_eyebrow_ar", v)} dir="rtl" />
            </Field>
            <Field label={tr("التسمية الصغيرة — إنجليزية", "Eyebrow EN")}>
              <TextInput value={form.value.objectives_eyebrow_en || ""} onChange={(v) => form.patch("objectives_eyebrow_en", v)} />
            </Field>
          </div>
          <div className="mt-4 max-w-[420px]">
            <FontScaleSlider form={form} sectionKey="objectives" styleKey="title_scale"
              labelAr="حجم خط عناوين الأهداف" labelEn="Objective titles font size"
              sample={tr("النهوض بالدراسات القانونية", "Advancing legal research")} sampleSize={22} />
          </div>

          <div className="mt-6 space-y-4" data-testid="home-objectives-editor">
            {objectives.map((obj, idx) => (
              <div key={obj.id || idx} className="border border-rule bg-paper p-5" data-testid={`objective-edit-${idx}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[12px] text-mute tabular-nums w-6">{idx + 1}</span>
                  <span className="text-[13px] text-navy-deep flex-1 truncate">{obj.title_ar || obj.title_en || `(${tr("بلا عنوان", "untitled")})`}</span>
                  <ReorderControls index={idx} total={objectives.length} onMove={moveObjective} testid={`objective-reorder-${idx}`} />
                  <button type="button" onClick={() => removeObjective(idx)}
                    className="ms-2 text-[11.5px] text-red-700 hover:text-red-900 inline-flex items-center gap-1"
                    data-testid={`objective-remove-${idx}`}>
                    <Trash2 size={11} /> {tr("حذف", "Delete")}
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Field label={tr("العنوان — عربية", "Title AR")}>
                    <TextInput value={obj.title_ar || ""} onChange={(v) => updateObjective(idx, { title_ar: v })} dir="rtl" testid={`objective-${idx}-title-ar`} />
                  </Field>
                  <Field label={tr("العنوان — إنجليزية", "Title EN")}>
                    <TextInput value={obj.title_en || ""} onChange={(v) => updateObjective(idx, { title_en: v })} testid={`objective-${idx}-title-en`} />
                  </Field>
                  <Field label={tr("الوصف — عربية", "Description AR")}>
                    <TextArea value={obj.description_ar || ""} onChange={(v) => updateObjective(idx, { description_ar: v })} dir="rtl" rows={4} testid={`objective-${idx}-desc-ar`} />
                  </Field>
                  <Field label={tr("الوصف — إنجليزية", "Description EN")}>
                    <TextArea value={obj.description_en || ""} onChange={(v) => updateObjective(idx, { description_en: v })} rows={4} testid={`objective-${idx}-desc-en`} />
                  </Field>
                </div>
              </div>
            ))}
            <button type="button" onClick={addObjective}
              className="lz-btn-ghost inline-flex items-center gap-1.5"
              data-testid="objective-add">
              <Plus size={14} /> {tr("إضافة هدف جديد", "Add a new objective")}
            </button>
          </div>
          <div className="mt-6">
            <BgImageBlock form={form} sectionKey="objectives" defaultOverlay={0.78}
              label={tr("خلفية قسم الأهداف (اختيارية)", "Objectives background (optional)")} />
          </div>
        </SectionCard>

        {/* ============================================================ */}
        {/* 5. FIELDS OF WORK                                              */}
        {/* ============================================================ */}
        <SectionCard id="fields_of_work" title={tr("مجالات العمل", "Fields of Work")}
          eyebrow={tr("٥", "5")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("fields_of_work")} onMove={moveSection}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
            <Field label={tr("التسمية الصغيرة — عربية", "Eyebrow AR")}>
              <TextInput value={form.value.fields_eyebrow_ar || ""} onChange={(v) => form.patch("fields_eyebrow_ar", v)} dir="rtl" />
            </Field>
            <Field label={tr("التسمية الصغيرة — إنجليزية", "Eyebrow EN")}>
              <TextInput value={form.value.fields_eyebrow_en || ""} onChange={(v) => form.patch("fields_eyebrow_en", v)} />
            </Field>
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="fields_title_ar" keyEn="fields_title_en"
              labelAr="عنوان القسم" labelEn="Section title" testid="fields-title" />
          </div>
          <div className="mt-3 max-w-[420px]">
            <FontScaleSlider form={form} sectionKey="fields_of_work" styleKey="title_scale"
              labelAr="حجم خط عناوين المجالات" labelEn="Field card titles size"
              sample={tr("التشريع والسياسات", "Legislation & policy")} sampleSize={20} />
          </div>

          <div className="mt-6 space-y-4">
            {fields.map((f, idx) => (
              <div key={f.id || idx} className="border border-rule bg-paper p-5" data-testid={`field-edit-${idx}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[12px] text-mute tabular-nums w-6">{idx + 1}</span>
                  <span className="text-[13px] text-navy-deep flex-1 truncate">{f.title_ar || f.title_en || `(${tr("بلا عنوان", "untitled")})`}</span>
                  <ReorderControls index={idx} total={fields.length} onMove={moveField} testid={`field-reorder-${idx}`} />
                  <button type="button" onClick={() => removeField(idx)}
                    className="ms-2 text-[11.5px] text-red-700 hover:text-red-900 inline-flex items-center gap-1"
                    data-testid={`field-remove-${idx}`}>
                    <Trash2 size={11} /> {tr("حذف", "Delete")}
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Field label={tr("العنوان — عربية", "Title AR")}>
                    <TextInput value={f.title_ar || ""} onChange={(v) => updateField(idx, { title_ar: v })} dir="rtl" testid={`field-${idx}-title-ar`} />
                  </Field>
                  <Field label={tr("العنوان — إنجليزية", "Title EN")}>
                    <TextInput value={f.title_en || ""} onChange={(v) => updateField(idx, { title_en: v })} testid={`field-${idx}-title-en`} />
                  </Field>
                  <Field label={tr("الوصف — عربية", "Description AR")}>
                    <TextArea value={f.description_ar || ""} onChange={(v) => updateField(idx, { description_ar: v })} dir="rtl" rows={3} />
                  </Field>
                  <Field label={tr("الوصف — إنجليزية", "Description EN")}>
                    <TextArea value={f.description_en || ""} onChange={(v) => updateField(idx, { description_en: v })} rows={3} />
                  </Field>
                  <Field label={tr("الأيقونة (lucide)", "Icon (lucide name)")} hint={tr("مثال: scale, scroll-text, landmark, book-open, compass", "e.g. scale, scroll-text, landmark, book-open, compass")}>
                    <TextInput value={f.icon || ""} onChange={(v) => updateField(idx, { icon: v })} testid={`field-${idx}-icon`} />
                  </Field>
                </div>
              </div>
            ))}
            <button type="button" onClick={addField}
              className="lz-btn-ghost inline-flex items-center gap-1.5"
              data-testid="field-add">
              <Plus size={14} /> {tr("إضافة مجال جديد", "Add a new field")}
            </button>
          </div>
          <div className="mt-6">
            <BiInput form={form} keyAr="fields_body_ar" keyEn="fields_body_en"
              labelAr="نص توضيحي للقسم (يظهر بجانب العنوان)" labelEn="Section body (next to the heading)"
              multiline rows={3} testid="fields-body" />
          </div>
          <div className="mt-5">
            <BgImageBlock form={form} sectionKey="fields_of_work" defaultOverlay={0.12}
              label={tr("خلفية قسم مجالات العمل (اختيارية)", "Fields of Work background (optional)")} />
          </div>
        </SectionCard>

        {/* ============================================================ */}
        {/* 6. FEATURED PUBLICATIONS                                       */}
        {/* ============================================================ */}
        <SectionCard id="featured_publications" title={tr("الإصدارات المميزة", "Featured Publications")}
          eyebrow={tr("٦", "6")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("featured_publications")} onMove={moveSection}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
            <Field label={tr("التسمية الصغيرة — عربية", "Eyebrow AR")}>
              <TextInput value={form.value.featured_eyebrow_ar || ""} onChange={(v) => form.patch("featured_eyebrow_ar", v)} dir="rtl" />
            </Field>
            <Field label={tr("التسمية الصغيرة — إنجليزية", "Eyebrow EN")}>
              <TextInput value={form.value.featured_eyebrow_en || ""} onChange={(v) => form.patch("featured_eyebrow_en", v)} />
            </Field>
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="featured_title_ar" keyEn="featured_title_en"
              labelAr="عنوان القسم" labelEn="Section title" testid="featured-title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="featured_blurb_ar" keyEn="featured_blurb_en"
              labelAr="نص توضيحي قصير" labelEn="Short blurb"
              multiline rows={2} testid="featured-blurb" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 max-w-[680px]">
            <Field label={tr("عدد الكروت المعروضة", "Cards to show")}>
              <Select
                value={String(form.value.featured_count ?? 3)}
                onChange={(v) => form.patch("featured_count", parseInt(v, 10))}
                options={[
                  { value: "3", label: "3" },
                  { value: "6", label: "6" },
                  { value: "9", label: "9" },
                ]}
                testid="featured-count"
              />
            </Field>
            <Field label={tr("طريقة الفرز", "Sort by")}>
              <Select
                value={form.value.featured_sort || "latest"}
                onChange={(v) => form.patch("featured_sort", v)}
                options={[
                  { value: "latest", label: tr("الأحدث", "Latest") },
                  { value: "most_viewed", label: tr("الأكثر مشاهدة", "Most viewed") },
                ]}
                testid="featured-sort"
              />
            </Field>
          </div>
          <div className="mt-6">
            <BgImageBlock form={form} sectionKey="featured_publications" defaultOverlay={0.12}
              label={tr("خلفية قسم الإصدارات (اختيارية)", "Featured Publications background (optional)")} />
          </div>
        </SectionCard>

        {/* ============================================================ */}
        {/* 7. CONTACT                                                     */}
        {/* ============================================================ */}
        <SectionCard id="contact" title={tr("التواصل", "Contact")}
          eyebrow={tr("٧", "7")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("contact")} onMove={moveSection}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
            <Field label={tr("التسمية الصغيرة — عربية", "Eyebrow AR")}>
              <TextInput value={form.value.contact_eyebrow_ar || ""} onChange={(v) => form.patch("contact_eyebrow_ar", v)} dir="rtl" />
            </Field>
            <Field label={tr("التسمية الصغيرة — إنجليزية", "Eyebrow EN")}>
              <TextInput value={form.value.contact_eyebrow_en || ""} onChange={(v) => form.patch("contact_eyebrow_en", v)} />
            </Field>
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="contact_title_ar" keyEn="contact_title_en"
              labelAr="عنوان القسم" labelEn="Section title" testid="contact-title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="contact_blurb_ar" keyEn="contact_blurb_en"
              labelAr="نص تعريفي" labelEn="Intro blurb"
              multiline rows={3} testid="contact-blurb" />
          </div>
          <div className="mt-5 px-4 py-3 bg-paper border border-rule text-[12.5px] text-mute leading-[1.85]">
            ℹ️ {tr(
              "بيانات الاتصال (البريد، الهاتف، العنوان) تُدار من «إعدادات الموقع» في القائمة الجانبية، وتنعكس هنا تلقائياً.",
              "Contact details (email, phone, address) are managed in “Site Settings” and reflected here automatically.",
            )}
          </div>
        </SectionCard>

        {/* ============================================================ */}
        {/* 8. NEWSLETTER                                                  */}
        {/* ============================================================ */}
        <SectionCard id="newsletter" title={tr("النشرة البريدية", "Newsletter")}
          eyebrow={tr("٨", "8")} visibleSections={visible} onToggleVisibility={toggleVisibility}
          {...orderInfo("newsletter")} onMove={moveSection}>
          <div className="mt-4">
            <BiInput form={form} keyAr="newsletter_title_ar" keyEn="newsletter_title_en"
              labelAr="العنوان" labelEn="Title" testid="news-title" />
          </div>
          <div className="mt-4">
            <BiInput form={form} keyAr="newsletter_blurb_ar" keyEn="newsletter_blurb_en"
              labelAr="النص" labelEn="Body copy"
              multiline rows={3} testid="news-blurb" />
          </div>
        </SectionCard>

      </div>

      <SaveBar dirty={form.dirty} saving={saving} onSave={save} onReset={form.reset} savedMessage={msg} />
    </AdminPage>
  );
}

/**
 * Shared section-control widgets used by per-page admin dashboards
 * (HomeAdmin uses inline copies; AboutAdmin and future page-admin
 * pages should import from here).
 *
 * Widgets:
 *  - SectionCard         · collapsible card with header (eyebrow + title)
 *                          + visibility toggle + reorder ↑/↓ + optional move handles
 *  - FontScaleSlider     · range slider that writes section_styles[k][styleKey]
 *  - ImageUploader       · upload to /api/uploads/image; returns URL
 *  - BgImageBlock        · enable/url/focal-point/overlay/alt — for section_styles[k].bg
 *  - FieldTypoControls   · per-field size + weight + color
 *  - AlignToggle         · 3-button alignment toggle (right · center · left)
 *  - BgColorControl      · section background color picker
 *  - GradientAccentControl · subtle diagonal gradient overlay picker
 *  - BiInput             · paired AR/EN <Field> inputs with optional typo controls
 *  - EyebrowRow          · paired AR/EN eyebrow inputs with optional typo controls
 *  - BiList              · paired AR/EN textarea (one item per line) with typo
 *
 * Storage convention (read by /app/frontend/src/lib/sectionTypo.js):
 *  section_styles[sectionKey] = {
 *    bg_color?: "#hex",
 *    gradient_accent?: "#hex",
 *    bg?: { url, focal_x, focal_y, overlay_opacity, alt_ar, alt_en, enabled },
 *    text_styles?: { [fieldKey]: { size, weight, color } },
 *    text_aligns?: { [fieldKey | fieldKey_ar | fieldKey_en]: "left|center|right" },
 *    [styleKey]?: number,  // FontScaleSlider arbitrary keys (e.g. title_scale)
 *  }
 */
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { Field, TextArea, TextInput } from "@/admin/components/AdminUI";
import { useLang } from "@/i18n/LanguageContext";
import { api, formatApiError } from "@/lib/api";

// ----- small text helpers (shared)
export const arrToText = (arr) => (Array.isArray(arr) ? arr.filter(Boolean).join("\n") : "");
export const textToArr = (txt) =>
  String(txt || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
export const uid = () => `id_${Math.random().toString(36).slice(2, 10)}`;


// ============================================================================
// <SectionCard>
// ============================================================================
export function SectionCard({
  id, title, eyebrow, children, defaultOpen = false,
  visibleSections, onToggleVisibility, hasVisibilityToggle = true,
  orderIndex, orderTotal, onMove,
  testid,
}) {
  // Auto-open if URL hash matches this section id (e.g. navigating from Sections Library)
  const hashMatch = typeof window !== "undefined" && window.location.hash === `#${id}`;
  const [open, setOpen] = useState(defaultOpen || hashMatch);

  useEffect(() => {
    if (hashMatch) {
      setOpen(true);
      // Scroll into view after a brief delay
      setTimeout(() => {
        const el = document.querySelector(`[data-testid="${testid || `section-${id}`}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, []); // eslint-disable-line
  const isVisible = visibleSections.includes(id);
  const hasReorder = typeof orderIndex === "number" && typeof orderTotal === "number" && typeof onMove === "function";
  const canMoveUp = hasReorder && orderIndex > 0;
  const canMoveDown = hasReorder && orderIndex < orderTotal - 1;
  return (
    <section
      className="border border-rule bg-white"
      style={{ order: hasReorder ? orderIndex : 999 }}
      data-testid={testid || `section-${id}`}
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


// ============================================================================
// <FontScaleSlider>
// ============================================================================
export function FontScaleSlider({ form, sectionKey, styleKey = "title_scale", labelAr, labelEn, sample, sampleSize = 24, min = 0.8, max = 1.5, step = 0.05 }) {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const styles = form.value.section_styles || {};
  const sectionObj = styles[sectionKey] || {};
  const v = typeof sectionObj[styleKey] === "number" ? sectionObj[styleKey] : 1;
  const pct = Math.round(v * 100);
  const setVal = (n) => {
    const nv = Math.max(min, Math.min(max, n));
    const next = { ...styles, [sectionKey]: { ...sectionObj, [styleKey]: Math.round(nv * 100) / 100 } };
    form.patch("section_styles", next);
  };
  return (
    <div className="border border-rule bg-paper px-4 py-3.5" data-testid={`fs-${sectionKey}-${styleKey}`}>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-[12.5px] font-medium text-navy-deep">{tr(labelAr, labelEn)}</label>
        <span className="text-[11.5px] text-mute tabular-nums">{pct}%</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={v}
        onChange={(e) => setVal(parseFloat(e.target.value))}
        className="w-full accent-brass cursor-pointer"
        data-testid={`fs-${sectionKey}-${styleKey}-slider`} />
      <div className="flex items-center justify-between gap-2 text-[11px] text-mute mt-1.5">
        <button type="button" onClick={() => setVal(1)} className="hover:text-navy underline underline-offset-2">
          {tr("إعادة إلى 100%", "Reset to 100%")}
        </button>
        <span className="opacity-70">{Math.round(min * 100)}% – {Math.round(max * 100)}%</span>
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


// ============================================================================
// <ImageUploader>
// ============================================================================
export function ImageUploader({ value, onChange, label, testid, hint }) {
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
          <button type="button" onClick={() => onChange("")}
            className="text-[11.5px] text-red-700 hover:text-red-900 inline-flex items-center gap-1"
            data-testid={`${testid}-clear`}>
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
        <input ref={fileRef} type="file" accept="image/*"
          onChange={(e) => upload(e.target.files?.[0])} className="sr-only"
          data-testid={`${testid}-input`} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
          className="lz-btn-ghost inline-flex items-center gap-1.5 disabled:opacity-50"
          data-testid={`${testid}-upload`}>
          <Upload size={13} />
          <span>{busy ? tr("جارٍ الرفع…", "Uploading…") : tr("رفع صورة", "Upload image")}</span>
        </button>
        <TextInput value={value || ""} onChange={onChange}
          placeholder={tr("أو ألصق رابط مباشر", "Or paste a direct URL")}
          testid={`${testid}-url`} />
      </div>
      {hint && <p className="mt-2 text-[11.5px] text-mute">{hint}</p>}
      {err && <p className="mt-2 text-[12px] text-red-700">{err}</p>}
    </div>
  );
}


// ============================================================================
// <BgImageBlock>
// ============================================================================
export function BgImageBlock({ form, sectionKey, defaultOverlay = 0.5, label }) {
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
  const overlay = typeof bg.overlay_opacity === "number" ? bg.overlay_opacity : defaultOverlay;
  const altAr = bg.alt_ar || "";
  const altEn = bg.alt_en || "";

  const writeBg = (patch) => {
    const next = { ...styles, [sectionKey]: { ...sectionObj, bg: { ...bg, ...patch } } };
    form.patch("section_styles", next);
  };

  async function upload(file) {
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      writeBg({ url: data.url, enabled: true });
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail) || e.message);
    } finally { setBusy(false); }
  }

  const onPreviewClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    writeBg({ focal_x: Math.max(0, Math.min(100, x)), focal_y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div className="border border-rule bg-white p-4" data-testid={`bg-${sectionKey}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[13px] font-medium text-navy-deep">{label || tr("صورة الخلفية", "Background image")}</span>
        <label className="inline-flex items-center gap-2 text-[12px] text-mute cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(e) => writeBg({ enabled: e.target.checked })}
            className="accent-navy" data-testid={`bg-${sectionKey}-enabled`} />
          <span>{tr("مفعّلة", "Enabled")}</span>
        </label>
      </div>

      {url ? (
        <div
          className="relative aspect-[16/7] bg-paper border border-rule overflow-hidden cursor-crosshair"
          onClick={onPreviewClick}
          data-testid={`bg-${sectionKey}-preview`}
        >
          <img src={url} alt="" className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover", objectPosition: `${fx}% ${fy}%` }} />
          <div aria-hidden className="absolute inset-0"
            style={{ background: `rgba(10,17,28,${overlay})` }} />
          <span aria-hidden style={{
            position: "absolute", left: `${fx}%`, top: `${fy}%`,
            width: 14, height: 14, borderRadius: "50%",
            border: "2px solid #fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
            transform: "translate(-50%,-50%)", pointerEvents: "none",
          }} />
        </div>
      ) : (
        <div className="aspect-[16/7] bg-paper border border-dashed border-rule flex items-center justify-center text-mute">
          <ImageIcon size={32} strokeWidth={1.4} />
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*"
          onChange={(e) => upload(e.target.files?.[0])} className="sr-only"
          data-testid={`bg-${sectionKey}-input`} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
          className="lz-btn-ghost inline-flex items-center gap-1.5 disabled:opacity-50"
          data-testid={`bg-${sectionKey}-upload`}>
          <Upload size={13} />
          <span>{busy ? tr("جارٍ الرفع…", "Uploading…") : tr("رفع صورة", "Upload image")}</span>
        </button>
        <TextInput value={url} onChange={(v) => writeBg({ url: v })}
          placeholder={tr("أو ألصق رابط مباشر", "Or paste a direct URL")}
          testid={`bg-${sectionKey}-url`} />
        {url && (
          <button type="button" onClick={() => writeBg({ url: "" })}
            className="text-[11.5px] text-red-700 hover:text-red-900 inline-flex items-center gap-1 px-2"
            data-testid={`bg-${sectionKey}-clear`}>
            <Trash2 size={11} /> {tr("إزالة", "Remove")}
          </button>
        )}
      </div>
      {err && <p className="mt-2 text-[12px] text-red-700">{err}</p>}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[12px] text-navy-deep">{tr("نقطة التركيز (X · Y)", "Focal point (X · Y)")}</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="number" min={0} max={100} value={fx}
              onChange={(e) => writeBg({ focal_x: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
              className="w-20 h-8 px-2 border border-rule text-[12px]"
              data-testid={`bg-${sectionKey}-fx`} />
            <span className="text-[11px] text-mute">×</span>
            <input type="number" min={0} max={100} value={fy}
              onChange={(e) => writeBg({ focal_y: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
              className="w-20 h-8 px-2 border border-rule text-[12px]"
              data-testid={`bg-${sectionKey}-fy`} />
            <span className="text-[11px] text-mute">{tr("(أو انقر على الصورة)", "(or click on preview)")}</span>
          </div>
        </div>
        <div>
          <label className="text-[12px] text-navy-deep">{tr("تعتيم الخلفية", "Overlay opacity")} · {Math.round(overlay * 100)}%</label>
          <input type="range" min={0} max={1} step="0.05" value={overlay}
            onChange={(e) => writeBg({ overlay_opacity: parseFloat(e.target.value) })}
            className="w-full accent-brass" data-testid={`bg-${sectionKey}-opacity`} />
        </div>
      </div>

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


// ============================================================================
// <FieldTypoControls>
// ============================================================================
export function FieldTypoControls({ form, sectionKey, fieldKey, testid }) {
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
        text_styles: { ...textStyles, [fieldKey]: { ...cur, ...patch } },
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
        <div className="flex items-center gap-2 min-w-[180px] flex-1">
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-mute shrink-0">حجم</span>
          <input type="range" min={0.8} max={2.0} step="0.05" value={size}
            onChange={(e) => write({ size: parseFloat(e.target.value) })}
            className="flex-1 accent-brass cursor-pointer" data-testid={`${tid}-size`} />
          <span className="text-[11px] text-mute tabular-nums w-10 text-end">{pct}%</span>
        </div>
        <label className="flex items-center gap-2 shrink-0">
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-mute">سماكة</span>
          <select value={weight} onChange={(e) => write({ weight: e.target.value })}
            className="h-7 text-[12px] border border-rule px-2 bg-white" data-testid={`${tid}-weight`}>
            <option value="">افتراضي</option>
            <option value="300">رفيع (300)</option>
            <option value="400">عادي (400)</option>
            <option value="500">متوسط (500)</option>
            <option value="600">سميك (600)</option>
            <option value="700">عريض (700)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 shrink-0">
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-mute">لون</span>
          <input type="color" value={color || "#0A111C"}
            onChange={(e) => write({ color: e.target.value })}
            className="w-7 h-7 border border-rule cursor-pointer bg-white" data-testid={`${tid}-color`} />
          {color && (
            <button type="button" onClick={() => write({ color: "" })}
              className="text-[10.5px] text-mute hover:text-red-700 underline underline-offset-2"
              title="إزالة اللون المخصص" data-testid={`${tid}-color-clear`}>مسح</button>
          )}
        </label>
        <button type="button" onClick={reset}
          className="text-[11px] text-mute hover:text-navy underline underline-offset-2 ms-auto"
          data-testid={`${tid}-reset`}>إعادة الكل</button>
      </div>
    </div>
  );
}


// ============================================================================
// <AlignToggle>
// ============================================================================
export function AlignToggle({ form, sectionKey, fieldKey, testid, langSuffix, label }) {
  const styles = form.value.section_styles || {};
  const sectionObj = styles[sectionKey] || {};
  const aligns = sectionObj.text_aligns || {};
  const storageKey = langSuffix ? `${fieldKey}_${langSuffix}` : fieldKey;
  const cur = aligns[storageKey] || "";
  const tid = testid || `align-${sectionKey}-${storageKey}`;
  const setVal = (v) => {
    const nextAligns = { ...aligns };
    if (v === "" || v === cur) delete nextAligns[storageKey];
    else nextAligns[storageKey] = v;
    form.patch("section_styles", { ...styles, [sectionKey]: { ...sectionObj, text_aligns: nextAligns } });
  };
  const Btn = ({ value, glyph, label: btnLabel }) => {
    const active = cur === value;
    return (
      <button type="button" onClick={() => setVal(value)}
        className={`px-2 h-7 text-[12px] border transition-colors ${
          active ? "bg-navy-deep text-paper border-navy-deep"
                 : "bg-white text-navy-deep border-rule hover:border-brass"
        }`}
        title={btnLabel} aria-pressed={active}
        data-testid={`${tid}-${value}`}>{glyph}</button>
    );
  };
  return (
    <div className="flex items-center gap-2 mb-1.5" data-testid={tid}>
      <span className="text-[10.5px] uppercase tracking-[0.14em] text-mute">{label || "محاذاة"}</span>
      <div className="inline-flex">
        <Btn value="right" glyph="⇥" label="يمين" />
        <Btn value="center" glyph="≡" label="وسط" />
        <Btn value="left" glyph="⇤" label="يسار" />
      </div>
      {cur && (
        <button type="button" onClick={() => setVal("")}
          className="text-[10.5px] text-mute hover:text-navy-deep underline underline-offset-2"
          data-testid={`${tid}-reset`}>افتراضي</button>
      )}
    </div>
  );
}

export function alignOf(form, sectionKey, fieldKey) {
  return form.value?.section_styles?.[sectionKey]?.text_aligns?.[fieldKey] || "";
}


// ============================================================================
// <BgColorControl>
// ============================================================================
// Default fallback palette (used before branding loads)
const DEFAULT_PALETTE = [
  { hex: "#0A111C", label: "Navy 900" },
  { hex: "#121A2A", label: "Navy Deep" },
  { hex: "#23324D", label: "Navy" },
  { hex: "#B89B5E", label: "Brass" },
  { hex: "#8B6914", label: "Gold Deep" },
  { hex: "#D4B896", label: "Brass Light" },
  { hex: "#F7F8FA", label: "Paper" },
  { hex: "#FAF9F6", label: "Ivory" },
  { hex: "#FFFFFF", label: "White" },
];

/** Fetch branding colors from admin API — cached in module scope */
let _brandingCache = null;
let _brandingInflight = null;
function useBrandingColors() {
  const [colors, setColors] = useState(_brandingCache);
  useEffect(() => {
    if (_brandingCache) { setColors(_brandingCache); return; }
    if (!_brandingInflight) {
      _brandingInflight = api.get("/admin/branding")
        .then(({ data }) => {
          _brandingCache = data;
          return data;
        })
        .catch(() => null)
        .finally(() => { _brandingInflight = null; });
    }
    _brandingInflight.then(d => { if (d) setColors(d); });
  }, []);
  return colors;
}

/** Build palette from live branding data */
function buildPalette(branding) {
  if (!branding) return DEFAULT_PALETTE;
  const p = branding.primary_color;
  const s = branding.secondary_color;
  const a = branding.accent_color;
  const bg = branding.background_color;
  const txt = branding.text_color;
  const muted = branding.muted_text_color;

  const unique = [];
  const seen = new Set();
  const add = (hex, label) => {
    if (!hex) return;
    const k = hex.toUpperCase();
    if (!seen.has(k)) { seen.add(k); unique.push({ hex, label }); }
  };

  // Primary brand colors
  add(s,     "لون ثانوي داكن");
  add(p,     "اللون الرئيسي");
  add(txt,   "لون النص");
  add(muted, "لون النص الخافت");
  // Accent
  add(a,     "لون التمييز (Brass/Gold)");
  // Shades computed from accent
  if (a) {
    add(lighten(a, 0.25), "تمييز فاتح");
    add(darken(a,  0.2),  "تمييز داكن");
  }
  // Backgrounds
  add(bg,        "خلفية الموقع");
  add("#FAF9F6",  "عاجي");
  add("#F3EFE6",  "عاجي داكن");
  add("#FFFFFF",  "أبيض");

  return unique.length ? unique : DEFAULT_PALETTE;
}

/** Simple hex lighten/darken helpers */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(v => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
function lighten(hex, t) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}
function darken(hex, t) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - t), g * (1 - t), b * (1 - t));
}

function BrandPalette({ current, onSelect }) {
  const { lang } = useLang();
  const branding = useBrandingColors();
  const palette = buildPalette(branding);

  return (
    <div className="mt-2 px-3 pb-2.5">
      <div className="text-[9.5px] uppercase tracking-[0.2em] text-mute mb-2">
        {lang === "ar" ? "ألوان الهوية" : "Brand colors"}
        {!branding && <span className="ms-1 opacity-50">…</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {palette.map(({ hex, label }) => {
          const isSelected = current?.toUpperCase() === hex.toUpperCase();
          return (
            <button
              key={hex}
              type="button"
              title={`${hex} — ${label}`}
              onClick={() => onSelect(hex)}
              style={{
                width: 22, height: 22,
                background: hex,
                border: isSelected
                  ? "2px solid var(--tb-gold, #B89B5E)"
                  : "1.5px solid rgba(28,37,51,0.15)",
                outline: isSelected ? "2px solid var(--tb-gold, #B89B5E)" : "none",
                outlineOffset: 2,
                borderRadius: 2,
                transition: "transform 0.15s, box-shadow 0.15s",
                transform: isSelected ? "scale(1.25)" : "scale(1)",
                boxShadow: isSelected ? "0 0 0 1px rgba(28,37,51,0.15)" : "none",
                flexShrink: 0,
              }}
              aria-label={`${hex} — ${label}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function BgColorControl({ form, sectionKey, styleKey = "bg_color", labelAr, labelEn, testid }) {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const current = form.value?.section_styles?.[sectionKey]?.[styleKey] || "";
  const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  const swatchValue = HEX_RE.test(current) ? current : "#0A111C";
  const setVal = (v) => {
    const sectionStyles = { ...(form.value.section_styles || {}) };
    const cur = { ...(sectionStyles[sectionKey] || {}) };
    if (v === "" || v == null) delete cur[styleKey];
    else cur[styleKey] = v;
    sectionStyles[sectionKey] = cur;
    form.patch("section_styles", sectionStyles);
  };
  const tid = testid || `bg-color-${sectionKey}-${styleKey}`;
  return (
    <div className="mt-4 bg-paper border border-rule" data-testid={tid}>
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="text-[11.5px] uppercase tracking-[0.14em] text-brass shrink-0">
          {tr(labelAr || "لون خلفية القسم", labelEn || "Section background")}
        </span>
        <input type="color" value={swatchValue}
          onChange={(e) => setVal(e.target.value)}
          className="w-8 h-8 cursor-pointer border border-rule shrink-0"
          style={{ padding: 2, background: "transparent" }}
          data-testid={`${tid}-swatch`} aria-label={tr("اختر لون", "Pick color")} />
        <input type="text" value={current}
          onChange={(e) => setVal(e.target.value.trim())} placeholder="#1A1A2E" spellCheck={false}
          className="font-mono text-[12px] px-2 py-1 border border-rule bg-white focus:outline-none focus:border-brass uppercase"
          style={{ width: 100 }} data-testid={`${tid}-hex`} />
        <button type="button" onClick={() => setVal("")}
          className="text-[11px] text-mute hover:text-navy-deep hover:underline ms-auto"
          data-testid={`${tid}-reset`}>{tr("إعادة الافتراضي", "Reset")}</button>
        {current === "" && (
          <span className="text-[10px] text-mute italic">
            {tr("(ثيم)", "(theme)")}
          </span>
        )}
      </div>
      <BrandPalette current={current} onSelect={setVal} />
    </div>
  );
}


// ============================================================================
// <GradientAccentControl>
// ============================================================================
export function GradientAccentControl({ form, sectionKey, labelAr, labelEn, testid }) {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const current = form.value?.section_styles?.[sectionKey]?.gradient_accent || "";
  const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  const swatchValue = HEX_RE.test(current) ? current : "#8B6914";
  const setVal = (v) => {
    const sectionStyles = { ...(form.value.section_styles || {}) };
    const cur = { ...(sectionStyles[sectionKey] || {}) };
    if (v === "" || v == null) delete cur.gradient_accent;
    else cur.gradient_accent = v;
    sectionStyles[sectionKey] = cur;
    form.patch("section_styles", sectionStyles);
  };
  const tid = testid || `gradient-${sectionKey}`;
  return (
    <div className="mt-2 bg-paper border border-rule" data-testid={tid}>
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="text-[11.5px] uppercase tracking-[0.14em] text-brass shrink-0">
          {tr(labelAr || "لون تدرج الخلفية", labelEn || "Gradient accent")}
        </span>
        <input type="color" value={swatchValue}
          onChange={(e) => setVal(e.target.value)}
          className="w-8 h-8 cursor-pointer border border-rule shrink-0"
          style={{ padding: 2, background: "transparent" }}
          data-testid={`${tid}-swatch`} aria-label={tr("اختر لون", "Pick color")} />
        <input type="text" value={current}
          onChange={(e) => setVal(e.target.value.trim())} placeholder="#8B6914" spellCheck={false}
          className="font-mono text-[12px] px-2 py-1 border border-rule bg-white focus:outline-none focus:border-brass uppercase"
          style={{ width: 100 }} data-testid={`${tid}-hex`} />
        <button type="button" onClick={() => setVal("")}
          className="text-[11px] text-mute hover:text-navy-deep hover:underline ms-auto"
          data-testid={`${tid}-reset`}>{tr("إعادة الافتراضي", "Reset")}</button>
        {current === "" && (
          <span className="text-[10px] text-mute italic">{tr("(بدون)", "(none)")}</span>
        )}
      </div>
      <BrandPalette current={current} onSelect={setVal} />
      <div className="text-[10.5px] text-mute px-3 pb-2">
        {tr("يُطبَّق كلون ثانوي في زاوية الخلفية بشفافية خفيفة.",
            "Soft accent applied in the section background corner.")}
      </div>
    </div>
  );
}


// ============================================================================
// <BiInput> · paired AR/EN with optional typography controls + alignment
// ============================================================================
export function BiInput({ form, keyAr, keyEn, labelAr, labelEn, multiline = false, rows = 3, testid, sectionKey, fieldKey, perLangAlign = false }) {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const Cmp = multiline ? TextArea : TextInput;
  const showTypo = sectionKey && fieldKey;
  const alignShared = showTypo && !perLangAlign ? alignOf(form, sectionKey, fieldKey) : "";
  const alignAr = perLangAlign && showTypo ? alignOf(form, sectionKey, `${fieldKey}_ar`) : alignShared;
  const alignEn = perLangAlign && showTypo ? alignOf(form, sectionKey, `${fieldKey}_en`) : alignShared;
  return (
    <div>
      {showTypo && (
        <FieldTypoControls form={form} sectionKey={sectionKey} fieldKey={fieldKey} testid={`typo-${testid}`} />
      )}
      {showTypo && !perLangAlign && (
        <AlignToggle form={form} sectionKey={sectionKey} fieldKey={fieldKey} testid={`align-${testid}`} />
      )}
      {showTypo && perLangAlign && (
        <div className="flex flex-wrap gap-x-6">
          <AlignToggle form={form} sectionKey={sectionKey} fieldKey={fieldKey} langSuffix="ar"
            testid={`align-${testid}-ar`} label="محاذاة العربية" />
          <AlignToggle form={form} sectionKey={sectionKey} fieldKey={fieldKey} langSuffix="en"
            testid={`align-${testid}-en`} label="محاذاة الإنجليزية" />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Field label={`${tr(labelAr, labelEn)} — ${tr("عربية", "AR")}`}>
          <Cmp value={form.value[keyAr] || ""} onChange={(v) => form.patch(keyAr, v)}
            dir="rtl" rows={rows} testid={`${testid}-ar`}
            style={alignAr ? { textAlign: alignAr } : undefined} />
        </Field>
        <Field label={`${tr(labelAr, labelEn)} — EN`}>
          <Cmp value={form.value[keyEn] || ""} onChange={(v) => form.patch(keyEn, v)}
            rows={rows} testid={`${testid}-en`}
            style={alignEn ? { textAlign: alignEn } : undefined} />
        </Field>
      </div>
    </div>
  );
}


// ============================================================================
// <EyebrowRow>
// ============================================================================
export function EyebrowRow({ form, keyAr, keyEn, sectionKey, testid, perLangAlign = false, fieldKey = "eyebrow" }) {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const alignShared = sectionKey && !perLangAlign ? alignOf(form, sectionKey, fieldKey) : "";
  const alignAr = perLangAlign && sectionKey ? alignOf(form, sectionKey, `${fieldKey}_ar`) : alignShared;
  const alignEn = perLangAlign && sectionKey ? alignOf(form, sectionKey, `${fieldKey}_en`) : alignShared;
  return (
    <div>
      {sectionKey && (
        <FieldTypoControls form={form} sectionKey={sectionKey} fieldKey={fieldKey} testid={`typo-${testid || sectionKey}-${fieldKey}`} />
      )}
      {sectionKey && !perLangAlign && (
        <AlignToggle form={form} sectionKey={sectionKey} fieldKey={fieldKey} testid={`align-${testid || sectionKey}-${fieldKey}`} />
      )}
      {sectionKey && perLangAlign && (
        <div className="flex flex-wrap gap-x-6">
          <AlignToggle form={form} sectionKey={sectionKey} fieldKey={fieldKey} langSuffix="ar"
            testid={`align-${testid || sectionKey}-${fieldKey}-ar`} label="محاذاة العربية" />
          <AlignToggle form={form} sectionKey={sectionKey} fieldKey={fieldKey} langSuffix="en"
            testid={`align-${testid || sectionKey}-${fieldKey}-en`} label="محاذاة الإنجليزية" />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Field label={tr("التسمية الصغيرة (eyebrow) — عربية", "Eyebrow AR")}>
          <TextInput value={form.value[keyAr] || ""} onChange={(v) => form.patch(keyAr, v)} dir="rtl"
            testid={`${testid}-eyebrow-ar`} style={alignAr ? { textAlign: alignAr } : undefined} />
        </Field>
        <Field label={tr("التسمية الصغيرة — إنجليزية", "Eyebrow EN")}>
          <TextInput value={form.value[keyEn] || ""} onChange={(v) => form.patch(keyEn, v)}
            testid={`${testid}-eyebrow-en`} style={alignEn ? { textAlign: alignEn } : undefined} />
        </Field>
      </div>
    </div>
  );
}


// ============================================================================
// <BiList> · paired AR/EN textareas (one item per line) with typo + align
// ============================================================================
export function BiList({ form, keyAr, keyEn, labelAr, labelEn, testid, sectionKey, fieldKey }) {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const showTypo = sectionKey && fieldKey;
  const align = showTypo ? alignOf(form, sectionKey, fieldKey) : "";
  const alignStyle = align ? { textAlign: align } : undefined;
  return (
    <div>
      {showTypo && (
        <FieldTypoControls form={form} sectionKey={sectionKey} fieldKey={fieldKey} testid={`typo-${testid}`} />
      )}
      {showTypo && (
        <AlignToggle form={form} sectionKey={sectionKey} fieldKey={fieldKey} testid={`align-${testid}`} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Field label={`${tr(labelAr, labelEn)} — ${tr("عربية (نقطة في كل سطر)", "AR (one per line)")}`}>
          <TextArea value={arrToText(form.value[keyAr])}
            onChange={(v) => form.patch(keyAr, textToArr(v))}
            dir="rtl" rows={5} testid={`${testid}-ar`} style={alignStyle} />
        </Field>
        <Field label={`${tr(labelAr, labelEn)} — ${tr("إنجليزية (نقطة في كل سطر)", "EN (one per line)")}`}>
          <TextArea value={arrToText(form.value[keyEn])}
            onChange={(v) => form.patch(keyEn, textToArr(v))}
            rows={5} testid={`${testid}-en`} style={alignStyle} />
        </Field>
      </div>
    </div>
  );
}


// ============================================================================
// Re-order helper used by list-like sections (objectives / board / partners)
// ============================================================================
export function moveItem(arr, from, to) {
  if (!Array.isArray(arr) || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

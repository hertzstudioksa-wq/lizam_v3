import { useEffect, useRef, useState } from "react";
import { AlertTriangle, RotateCcw, Upload, Trash2, CheckCircle2 } from "lucide-react";
import { AdminPage } from "@/admin/components/AdminUI";
import { useLang } from "@/i18n/LanguageContext";
import { api, formatApiError } from "@/lib/api";
import { invalidateHeroCache } from "@/hooks/useHeroMedia";

/* ---------- Page registry ----------
 * The order here drives the order in the admin UI. Page keys MUST match the
 * backend's ALLOWED_PAGE_KEYS enum (see /backend/app/models_hero.py).
 */
const BUILTIN_PAGES = [
  { key: "_default", labelAr: "افتراضي عام", labelEn: "Global default", helpAr: "يستخدم لأي صفحة لا يوجد لها صورة مخصصة (أو حُذفت صورتها).", helpEn: "Used by any page that doesn't have a dedicated record." },
  // "home" intentionally removed — managed in /admin/home → Hero card.
  { key: "publications", labelAr: "صفحة الإصدارات", labelEn: "Publications page" },
  { key: "about", labelAr: "صفحة عن المركز", labelEn: "About page" },
  { key: "contact", labelAr: "صفحة التواصل", labelEn: "Contact page" },
];
const BUILTIN_KEYS = new Set(BUILTIN_PAGES.map((p) => p.key));
/** Page keys hidden from the Hero Media section because they're managed
 *  elsewhere. Records stay in the DB (read by their respective public pages). */
const HIDDEN_PAGE_KEYS = new Set(["home"]);

/* Recommended dimensions per page (built-in only; custom pages get a sensible default). */
const RECO_BY_KEY = {
  _default: { w: 2400, h: 1100, ratio: "≈ 21:10" },
  home: { w: 2400, h: 1100, ratio: "≈ 21:10" },
  publications: { w: 2400, h: 800, ratio: "≈ 3:1 (cinematic band)" },
  about: { w: 2400, h: 1100, ratio: "≈ 21:10" },
  contact: { w: 2400, h: 800, ratio: "≈ 3:1 (cinematic band)" },
};
const RECO_FALLBACK = { w: 2400, h: 1100, ratio: "≈ 21:10" };
const recoFor = (key) => RECO_BY_KEY[key] || RECO_FALLBACK;

const MIN_W = 1600;
const MIN_H = 700;

const DEFAULTS = {
  media_type: "image",
  url: "",
  overlay_opacity: 0.55,
  focal_x: 50,
  focal_y: 50,
  enabled: true,
};

export default function HeroMediaAdmin() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  return (
    <AdminPage
      title={tr("صور رؤوس الصفحات", "Hero Media")}
      subtitle={tr("صور خلفية سينمائية لكل صفحة", "Cinematic page hero images")}
    >
      <HeroMediaSection />
    </AdminPage>
  );
}

/* Reusable inner section (no AdminPage wrapper) — used by the unified
 * /admin/images page so Hero Media + Section Assets live in one place. */
export function HeroMediaSection() {
  const { lang } = useLang();
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [msg, setMsg] = useState("");

  async function refresh() {
    try {
      const { data } = await api.get("/admin/hero-media");
      const map = {};
      for (const it of data.items || []) map[it.page_key] = it;
      setItems(map);
    } catch (e) {
      setMsg(`${tr("خطأ في التحميل", "Load error")}: ${formatApiError(e.response?.data?.detail) || e.message}`);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  function setItem(key, patch) {
    setItems((s) => ({ ...s, [key]: { ...DEFAULTS, ...(s[key] || { page_key: key }), ...patch } }));
  }

  async function save(key) {
    setSavingKey(key);
    try {
      const cur = items[key] || { ...DEFAULTS, page_key: key };
      const body = {
        media_type: cur.media_type || "image",
        url: cur.url || "",
        overlay_opacity: cur.overlay_opacity ?? 0.55,
        focal_x: cur.focal_x ?? 50,
        focal_y: cur.focal_y ?? 50,
        enabled: cur.enabled !== false,
        alt_ar: cur.alt_ar || "",
        alt_en: cur.alt_en || "",
      };
      const { data } = await api.patch(`/admin/hero-media/${key}`, body);
      setItems((s) => ({ ...s, [key]: data }));
      invalidateHeroCache();
      setMsg(tr("تم الحفظ ✓ — التغييرات تطبق فوراً على الموقع.", "Saved ✓ — applied to public site instantly."));
      setTimeout(() => setMsg(""), 3500);
    } catch (e) {
      setMsg(`${tr("خطأ", "Error")}: ${formatApiError(e.response?.data?.detail) || e.message}`);
    } finally {
      setSavingKey(null);
    }
  }

  async function resetToDefault(key) {
    if (key === "_default") return;
    if (!window.confirm(tr("هل تريد إزالة الصورة المخصصة لهذه الصفحة والرجوع إلى الافتراضي؟", "Remove this page's custom hero and revert to the global default?"))) return;
    try {
      await api.delete(`/admin/hero-media/${key}`);
      setItems((s) => { const n = { ...s }; delete n[key]; return n; });
      invalidateHeroCache();
      setMsg(tr("أعيد إلى الافتراضي ✓", "Reverted to default ✓"));
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setMsg(`${tr("خطأ", "Error")}: ${e.message}`);
    }
  }

  async function deleteCustom(key) {
    if (BUILTIN_KEYS.has(key)) return resetToDefault(key);
    if (!window.confirm(tr(`هل تريد حذف "${key}" بالكامل؟`, `Remove the "${key}" custom page entirely?`))) return;
    try {
      await api.delete(`/admin/hero-media/${key}`);
      setItems((s) => { const n = { ...s }; delete n[key]; return n; });
      invalidateHeroCache();
      setMsg(tr("تم الحذف ✓", "Deleted ✓"));
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setMsg(`${tr("خطأ في الحذف", "Delete error")}: ${e.message}`);
    }
  }

  async function addCustomPage({ page_key, label_ar, label_en }) {
    const body = {
      label_ar, label_en,
      media_type: "image", url: "", overlay_opacity: 0.55,
      focal_x: 50, focal_y: 50, enabled: true,
    };
    const { data } = await api.patch(`/admin/hero-media/${page_key}`, body);
    setItems((s) => ({ ...s, [page_key]: data }));
    invalidateHeroCache();
    setMsg(tr(`أُضيفت الصفحة "${page_key}" ✓`, `Added page "${page_key}" ✓`));
    setTimeout(() => setMsg(""), 3000);
  }

  if (loading) return <div className="p-10 text-mute">{tr("جارٍ التحميل…", "Loading…")}</div>;

  // Compose the list of rows: built-in pages first (in defined order), then any
  // custom pages the admin has created via "Add page".
  const customPages = Object.values(items)
    .filter((it) => !BUILTIN_KEYS.has(it.page_key) && !HIDDEN_PAGE_KEYS.has(it.page_key))
    .sort((a, b) => (a.page_key || "").localeCompare(b.page_key || ""))
    .map((it) => ({
      key: it.page_key,
      labelAr: it.label_ar || it.page_key,
      labelEn: it.label_en || it.page_key,
      custom: true,
    }));
  const allPages = [...BUILTIN_PAGES, ...customPages];

  return (
    <>
      <p className="max-w-[760px] text-[13.5px] text-ink/75 leading-relaxed mb-6">
        {tr(
          "لكل صفحة صورة خلفية يمكن تخصيصها — أبعاد موصى بها 2400×1100، أقل من 1600×700 ستظهر منخفضة الجودة. تحكم في درجة التعتيم ونقطة التركيز عبر الأدوات أدناه. الصور تمتد خلف الهيدر وتتقصّ تلقائياً مع الحفاظ على نقطة التركيز.",
          "Each page has its own cinematic hero image. Recommended size 2400×1100; below 1600×700 may render soft. Use the controls below to set overlay opacity and focal point. Images extend behind the header and auto-crop responsively while keeping the focal point in frame.",
        )}
      </p>
      {msg && <div className="mb-4 p-3 border border-rule bg-paper text-[13.5px]" data-testid="hero-media-msg">{msg}</div>}
      <div className="space-y-8 max-w-[1100px]">
        {allPages.map((p) => (
          <PageRow
            key={p.key}
            page={p}
            item={items[p.key] || { ...DEFAULTS, page_key: p.key }}
            onChange={(patch) => setItem(p.key, patch)}
            onSave={() => save(p.key)}
            onReset={() => resetToDefault(p.key)}
            onDeleteCustom={() => deleteCustom(p.key)}
            saving={savingKey === p.key}
            tr={tr}
            lang={lang}
            isExisting={!!items[p.key]}
            isCustom={!!p.custom}
          />
        ))}
      </div>

      {/* Add custom page */}
      <AddCustomPageForm
        existingKeys={Object.keys(items)}
        onAdd={addCustomPage}
        tr={tr}
      />
    </>
  );
}

function AddCustomPageForm({ existingKeys, onAdd, tr }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [labelAr, setLabelAr] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function validate(k) {
    if (!k) return tr("اكتب معرّف الصفحة.", "Enter a page key.");
    if (!/^[a-z][a-z0-9_-]{1,39}$/.test(k)) return tr("استخدم أحرف صغيرة، أرقام، شَرطات، يبدأ بحرف، 2-40 رمز.", "Lowercase letters/digits/dashes only, 2–40 chars, starts with a letter.");
    if (existingKeys.includes(k)) return tr("هذا المعرّف موجود بالفعل.", "This key already exists.");
    return "";
  }

  async function submit(e) {
    e.preventDefault();
    const v = validate(key.trim().toLowerCase());
    if (v) { setErr(v); return; }
    setBusy(true); setErr("");
    try {
      await onAdd({ page_key: key.trim().toLowerCase(), label_ar: labelAr || key, label_en: labelEn || key });
      setKey(""); setLabelAr(""); setLabelEn(""); setOpen(false);
    } catch (e2) {
      setErr(e2.message || String(e2));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 border border-dashed border-rule hover:border-navy-deep text-[13px] text-mute hover:text-navy-deep transition-colors"
        data-testid="hero-add-custom-page-btn"
      >
        + {tr("إضافة صفحة جديدة", "Add another page")}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 p-5 border border-rule bg-paper" data-testid="hero-add-custom-page-form">
      <h4 className="text-[14px] font-medium text-navy-deep mb-3">{tr("إضافة صفحة hero مخصصة", "Add a custom hero page")}</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-[820px]">
        <div>
          <label className="text-[12px] text-navy-deep block mb-1">{tr("معرّف الصفحة (slug)", "Page key (slug)")}</label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
            placeholder={tr("مثلاً: research", "e.g. research")}
            className="w-full h-10 px-3 border border-rule focus:border-navy outline-none text-[13.5px]"
            data-testid="hero-add-key"
          />
        </div>
        <div>
          <label className="text-[12px] text-navy-deep block mb-1">{tr("اسم بالعربي", "Arabic label")}</label>
          <input
            type="text"
            value={labelAr}
            onChange={(e) => setLabelAr(e.target.value)}
            placeholder={tr("مثلاً: صفحة الأبحاث", "e.g. Research page")}
            className="w-full h-10 px-3 border border-rule focus:border-navy outline-none text-[13.5px]"
            dir="rtl"
            data-testid="hero-add-label-ar"
          />
        </div>
        <div>
          <label className="text-[12px] text-navy-deep block mb-1">{tr("اسم بالإنجليزي", "English label")}</label>
          <input
            type="text"
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            placeholder="e.g. Research page"
            className="w-full h-10 px-3 border border-rule focus:border-navy outline-none text-[13.5px]"
            data-testid="hero-add-label-en"
          />
        </div>
      </div>
      {err && <div className="mt-3 text-[12.5px] text-red-700">{err}</div>}
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={busy} className="h-10 px-4 bg-navy-deep text-white text-[13px] disabled:opacity-50" data-testid="hero-add-submit">
          {busy ? tr("جارٍ الإضافة…", "Adding…") : tr("إضافة", "Add")}
        </button>
        <button type="button" onClick={() => { setOpen(false); setErr(""); }} className="text-[13px] text-mute hover:text-navy underline underline-offset-4">
          {tr("إلغاء", "Cancel")}
        </button>
      </div>
      <p className="mt-3 text-[11.5px] text-mute leading-relaxed max-w-[60ch]">
        {tr(
          "بعد الإضافة تستطيع رفع صورة هذه الصفحة هنا. لربط الصورة بصفحة عامة جديدة في الموقع، يحتاج المطوّر تركيب مكوّن HeroMediaLayer بنفس المعرّف.",
          "After adding, you can upload an image for this key. To link it to a new public page, a developer needs to render <HeroMediaLayer pageKey='<key>'> on that page.",
        )}
      </p>
    </form>
  );
}

/* ---------------- Per-page row ---------------- */
function PageRow({ page, item, onChange, onSave, onReset, onDeleteCustom, saving, tr, lang, isExisting, isCustom }) {
  const fileRef = useRef(null);
  const [warn, setWarn] = useState(null);
  const [dims, setDims] = useState(null);
  const [uploading, setUploading] = useState(false);

  const reco = recoFor(page.key);

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setWarn(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Read dimensions client-side for guidance
      const img = new Image();
      img.onload = () => {
        setDims({ w: img.naturalWidth, h: img.naturalHeight });
        if (img.naturalWidth < MIN_W || img.naturalHeight < MIN_H) {
          setWarn(
            tr(
              `الصورة صغيرة (${img.naturalWidth}×${img.naturalHeight}). الموصى به ${reco.w}×${reco.h} أو أكبر.`,
              `Image is small (${img.naturalWidth}×${img.naturalHeight}). Recommended ${reco.w}×${reco.h} or larger.`,
            ),
          );
        }
      };
      img.src = data.url;
      onChange({ url: data.url, media_type: "image", enabled: true });
    } catch (err) {
      setWarn(tr("فشل رفع الصورة.", "Upload failed.") + " " + (formatApiError(err.response?.data?.detail) || err.message));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function onPreviewClick(e) {
    // Click anywhere on the preview to set the focal point
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100);
    const y = Math.round(((e.clientY - r.top) / r.height) * 100);
    onChange({ focal_x: Math.max(0, Math.min(100, x)), focal_y: Math.max(0, Math.min(100, y)) });
  }

  const fx = item.focal_x ?? 50;
  const fy = item.focal_y ?? 50;
  const opacity = item.overlay_opacity ?? 0.55;

  return (
    <section
      className="border border-rule bg-white"
      data-testid={`hero-media-row-${page.key}`}
    >
      <header className="flex items-baseline justify-between gap-3 px-6 py-4 border-b border-rule bg-paper">
        <div>
          <div className="text-[12px] uppercase tracking-[0.2em] text-mute">{page.key}</div>
          <h3 className="text-[16px] font-medium text-navy-deep mt-0.5">
            {tr(page.labelAr, page.labelEn)}
          </h3>
          {(page.helpAr || page.helpEn) && (
            <p className="text-[12.5px] text-mute mt-1 max-w-[60ch]">
              {tr(page.helpAr || "", page.helpEn || "")}
            </p>
          )}
          {isCustom && (
            <p className="text-[11.5px] text-mute mt-1 max-w-[60ch] inline-flex items-center gap-1.5">
              <AlertTriangle size={11} />
              {tr(
                "صفحة مخصصة — يحتاج المطوّر إضافة <HeroMediaLayer /> بنفس المعرّف لظهور الصورة على الموقع.",
                "Custom page — a developer needs to render <HeroMediaLayer /> with this key to make it visible publicly.",
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-[12.5px] text-navy-deep cursor-pointer">
            <input
              type="checkbox"
              checked={item.enabled !== false}
              onChange={(e) => onChange({ enabled: e.target.checked })}
              data-testid={`hero-${page.key}-enabled`}
            />
            <span>{tr("مفعّل", "Enabled")}</span>
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 py-5">
        {/* Live preview */}
        <div>
          <div className="text-[11.5px] uppercase tracking-[0.18em] text-mute mb-2">
            {tr("المعاينة المباشرة (اضغط لتحديد نقطة التركيز)", "Live preview — click to set focal point")}
          </div>
          <div
            onClick={item.url ? onPreviewClick : undefined}
            className="relative w-full overflow-hidden border border-rule"
            style={{
              aspectRatio: "21 / 10",
              background: item.url ? `#0A111C` : "#E5E0D5",
              cursor: item.url ? "crosshair" : "default",
            }}
            data-testid={`hero-${page.key}-preview`}
          >
            {item.url ? (
              <>
                <img
                  src={item.url}
                  alt=""
                  className="absolute inset-0 w-full h-full"
                  style={{ objectFit: "cover", objectPosition: `${fx}% ${fy}%` }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: `rgba(10,17,28,${opacity})` }}
                />
                {/* Safe-crop overlay (centre 60% horizontal, 70% vertical) */}
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    inset: 0,
                    boxShadow: "inset 0 0 0 1px rgba(180,145,74,0.55)",
                    margin: "15% 20%",
                    borderRadius: 2,
                  }}
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
                {tr("لا توجد صورة — استخدم الرفع لاختيار صورة", "No image — upload one to begin")}
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11.5px] text-mute">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "rgba(180,145,74,0.95)" }} />
              {tr("نقطة التركيز", "Focal point")}: {fx}%, {fy}%
            </span>
            {dims && (
              <span className="ms-auto inline-flex items-center gap-1.5">
                {dims.w >= MIN_W && dims.h >= MIN_H ? (
                  <CheckCircle2 size={13} className="text-green-700" />
                ) : (
                  <AlertTriangle size={13} className="text-amber-600" />
                )}
                {dims.w}×{dims.h}px
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-5">
          {/* URL + upload */}
          <div>
            <label className="text-[12.5px] text-navy-deep block mb-1">
              {tr("رابط الصورة", "Image URL")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.url || ""}
                onChange={(e) => onChange({ url: e.target.value })}
                className="flex-1 h-10 px-3 border border-rule focus:border-navy outline-none text-[13.5px]"
                placeholder="https://… or /api/uploads/images/…"
                data-testid={`hero-${page.key}-url`}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 h-10 px-3 border border-navy-deep text-[12.5px] text-navy-deep hover:bg-navy-deep hover:text-white transition-colors"
                data-testid={`hero-${page.key}-upload-btn`}
              >
                <Upload size={13} />
                {uploading ? tr("جارٍ الرفع…", "Uploading…") : tr("رفع", "Upload")}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={onPickFile}
                data-testid={`hero-${page.key}-file`}
              />
            </div>
          </div>

          {/* Recommended size + warnings */}
          <div className="text-[12.5px] text-mute leading-relaxed border-s-2 border-brass ps-3 py-1">
            <div>
              <strong className="text-navy-deep">{tr("الموصى به", "Recommended")}:</strong>{" "}
              {reco.w}×{reco.h}px · {reco.ratio}
            </div>
            <div className="mt-1">
              {tr("الحد الأدنى", "Minimum")}: {MIN_W}×{MIN_H}px ·{" "}
              {tr("صيغ مقبولة", "Allowed")}: JPG, PNG, WebP
            </div>
            {warn && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-amber-700">
                <AlertTriangle size={13} /> {warn}
              </div>
            )}
          </div>

          {/* Overlay opacity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12.5px] text-navy-deep">
                {tr("تعتيم الخلفية", "Overlay opacity")}
              </label>
              <span className="text-[11.5px] text-mute tabular-nums">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.9"
              step="0.05"
              value={opacity}
              onChange={(e) => onChange({ overlay_opacity: parseFloat(e.target.value) })}
              className="w-full accent-brass cursor-pointer"
              data-testid={`hero-${page.key}-opacity`}
            />
            <div className="text-[11px] text-mute mt-1">
              {tr(
                "0% = صورة صافية. 90% = خلفية شبه سوداء. الموصى به 50–60% عشان النص يظل واضحاً.",
                "0% = raw image. 90% = near-black. Recommended 50–60% so headlines remain readable.",
              )}
            </div>
          </div>

          {/* Focal point sliders (mirror of preview click) */}
          <div className="grid grid-cols-2 gap-3">
            <FocalSlider label={tr("التركيز ↔ (X)", "Focal X ↔")} value={fx} onChange={(v) => onChange({ focal_x: v })} testid={`hero-${page.key}-fx`} />
            <FocalSlider label={tr("التركيز ↕ (Y)", "Focal Y ↕")} value={fy} onChange={(v) => onChange({ focal_y: v })} testid={`hero-${page.key}-fy`} />
          </div>

          {/* Alt text */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-navy-deep block mb-1">{tr("نص بديل — عربي", "Alt — AR")}</label>
              <input
                type="text"
                value={item.alt_ar || ""}
                onChange={(e) => onChange({ alt_ar: e.target.value })}
                className="w-full h-9 px-2 border border-rule focus:border-navy outline-none text-[13px]"
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-[12px] text-navy-deep block mb-1">Alt — EN</label>
              <input
                type="text"
                value={item.alt_en || ""}
                onChange={(e) => onChange({ alt_en: e.target.value })}
                className="w-full h-9 px-2 border border-rule focus:border-navy outline-none text-[13px]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="h-10 px-4 bg-navy-deep text-white text-[13px] disabled:opacity-50"
              data-testid={`hero-${page.key}-save`}
            >
              {saving ? tr("جارٍ الحفظ…", "Saving…") : tr("حفظ", "Save")}
            </button>
            {item.url && (
              <button
                type="button"
                onClick={() => onChange({ url: "" })}
                className="inline-flex items-center gap-1.5 h-10 px-3 border border-rule text-[12.5px] text-mute hover:text-red-700 hover:border-red-700"
                data-testid={`hero-${page.key}-clear`}
              >
                <Trash2 size={13} />
                {tr("إزالة الصورة", "Clear image")}
              </button>
            )}
            {page.key !== "_default" && isExisting && !isCustom && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 h-10 px-3 text-[12.5px] text-mute hover:text-navy underline underline-offset-4"
                data-testid={`hero-${page.key}-reset`}
              >
                <RotateCcw size={12} />
                {tr("إعادة إلى الافتراضي العام", "Reset to global default")}
              </button>
            )}
            {isCustom && (
              <button
                type="button"
                onClick={onDeleteCustom}
                className="inline-flex items-center gap-1.5 h-10 px-3 text-[12.5px] text-mute hover:text-red-700 underline underline-offset-4"
                data-testid={`hero-${page.key}-delete-custom`}
              >
                <Trash2 size={12} />
                {tr("حذف هذه الصفحة", "Delete this page")}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
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

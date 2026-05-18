import { useCallback, useRef, useState } from "react";
import { Save } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { EmbeddedAdminCtx } from "@/admin/components/EmbeddedAdminCtx";
import HomeAdmin from "./HomeAdmin";
import AboutAdmin from "./AboutAdmin";
import ContactAdmin from "./ContactAdmin";
import PublicationsPageAdmin from "./PublicationsPageAdmin";

const PAGES = [
  { id: "home",         label_ar: "الصفحة الرئيسية", label_en: "Home",         color: "#B08C5A" },
  { id: "about",        label_ar: "عن المركز",        label_en: "About",        color: "#7FA8C9" },
  { id: "publications", label_ar: "الإصدارات",         label_en: "Publications", color: "#7BA08A" },
  { id: "contact",      label_ar: "التواصل",           label_en: "Contact",      color: "#9B8ABF" },
];

export default function AllSectionsAdmin() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Registry of save functions — each SaveBar registers itself on mount
  const savesRef = useRef(new Set());
  const register = useCallback((fn) => {
    savesRef.current.add(fn);
    return () => savesRef.current.delete(fn);
  }, []);

  const saveAll = async () => {
    setSaving(true);
    setMsg("");
    try {
      await Promise.all([...savesRef.current].map((fn) => fn()));
      setMsg(ar ? "تم حفظ جميع التغييرات ✓" : "All changes saved ✓");
      setTimeout(() => setMsg(""), 4000);
    } catch {
      setMsg(ar ? "حدث خطأ أثناء الحفظ" : "Error saving");
    }
    setSaving(false);
  };

  const scrollTo = (id) =>
    document.getElementById(`page-block-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <EmbeddedAdminCtx.Provider value={{ register }}>
      <div className="min-h-screen" style={{ background: "var(--tb-paper-base, #F9F7F3)" }}>

        {/* ── Sticky top bar: navigation + save button ── */}
        <div
          className="sticky top-0 z-30 flex items-center gap-0 border-b border-rule"
          style={{ background: "#0A111C" }}
        >
          {/* Label */}
          <div
            className="shrink-0 px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-ivory/40 overflow-x-auto"
            style={{ borderInlineEnd: "1px solid rgba(255,255,255,0.08)" }}
          >
            {ar ? "الأقسام" : "Sections"}
          </div>

          {/* Page anchors */}
          <div className="flex flex-1 items-center overflow-x-auto">
            {PAGES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => scrollTo(p.id)}
                className="shrink-0 px-5 py-3 text-[12.5px] text-ivory/60 hover:text-ivory transition-colors duration-200 whitespace-nowrap"
                style={{ borderInlineEnd: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full me-2 align-middle"
                  style={{ background: p.color }}
                />
                {ar ? p.label_ar : p.label_en}
              </button>
            ))}
          </div>

          {/* Single save button */}
          <div className="shrink-0 flex items-center gap-3 px-4 py-2" style={{ borderInlineStart: "1px solid rgba(255,255,255,0.08)" }}>
            {msg && (
              <span className="text-[12.5px] text-green-400 whitespace-nowrap">{msg}</span>
            )}
            <button
              type="button"
              onClick={saveAll}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-[13px] font-medium transition-colors duration-200 disabled:opacity-50"
              style={{ background: "#B08C5A", color: "#0A111C" }}
            >
              <Save size={14} />
              <span>{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ الكل" : "Save All")}</span>
            </button>
          </div>
        </div>

        {/* ── Page blocks ── */}
        {PAGES.map((p) => (
          <div key={p.id} id={`page-block-${p.id}`}>
            {/* Divider label */}
            <div
              className="flex items-center gap-4 px-8 py-4"
              style={{ background: p.color + "18", borderTop: `3px solid ${p.color}` }}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
              <span
                className="text-[11px] uppercase tracking-[0.24em] font-semibold"
                style={{ color: p.color }}
              >
                {ar ? p.label_ar : p.label_en}
              </span>
            </div>

            {p.id === "home"         && <HomeAdmin />}
            {p.id === "about"        && <AboutAdmin />}
            {p.id === "publications" && <PublicationsPageAdmin />}
            {p.id === "contact"      && <ContactAdmin />}
          </div>
        ))}

        {/* ── Bottom save button ── */}
        <div className="flex justify-center py-10">
          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 text-[14px] font-medium transition-colors duration-200 disabled:opacity-50"
            style={{ background: "#B08C5A", color: "#0A111C" }}
          >
            <Save size={15} />
            <span>{saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ جميع التغييرات" : "Save All Changes")}</span>
          </button>
        </div>
      </div>
    </EmbeddedAdminCtx.Provider>
  );
}

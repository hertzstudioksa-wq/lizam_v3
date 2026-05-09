import { Info } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

/**
 * HelpTip — small ⓘ icon with a bilingual hover tooltip for technical fields.
 *
 * Usage:
 *   <HelpTip ar="يحدد من يستطيع الوصول لمحتوى الإصدار" en="Controls who can read the publication content" />
 *
 * Tooltip is CSS-only (no positioning library), shows above and slightly
 * to the inline-end of the icon. Designed to be unobtrusive — sits inline
 * next to a field label without taking extra row space.
 */
export default function HelpTip({ ar, en, side = "top", testid }) {
  const { lang } = useLang();
  const text = lang === "ar" ? ar : (en || ar);
  if (!text) return null;
  return (
    <span
      className="lz-helptip relative inline-flex align-middle ms-1.5 cursor-help"
      tabIndex={0}
      role="img"
      aria-label={text}
      data-testid={testid || "help-tip"}
      data-side={side}
    >
      <Info size={13} strokeWidth={1.7} className="text-mute hover:text-navy transition-colors" />
      <span
        className="lz-helptip-bubble"
        style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          insetInlineStart: 0,
          background: "#0E1A2C",
          color: "#FAF9F6",
          padding: "10px 14px",
          fontSize: 12.5,
          lineHeight: 1.7,
          width: 280,
          maxWidth: "62vw",
          textAlign: lang === "ar" ? "right" : "left",
          fontFamily: lang === "ar" ? '"Thmanyah Sans", sans-serif' : '"Thmanyah Sans", sans-serif',
          boxShadow: "0 12px 28px -8px rgba(0,0,0,0.35)",
          borderRadius: 4,
          opacity: 0,
          visibility: "hidden",
          transform: "translateY(4px)",
          transition: "opacity .18s, transform .18s, visibility .18s",
          zIndex: 60,
          pointerEvents: "none",
          whiteSpace: "normal",
        }}
      >
        {text}
      </span>
      <style>{`
        .lz-helptip:hover .lz-helptip-bubble,
        .lz-helptip:focus .lz-helptip-bubble {
          opacity: 1 !important;
          visibility: visible !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </span>
  );
}

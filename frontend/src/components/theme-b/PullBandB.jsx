import { Quote } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

/**
 * Theme B — Institutional Pull Band.
 * Sits between Mission/Vision and Objectives to break the section monotony.
 * Centered editorial pull-quote on warm paper background, refined gold accents.
 */
export default function PullBandB() {
  const { lang } = useLang();

  const text = lang === "ar"
    ? "نقدّم بحثاً قانونياً مستقلاً ومنهجياً، يخدم صناعة القرار في المؤسسات الحكومية والخاصة، وفق المعايير الأكاديمية الدولية وخصوصيات النظام السعودي."
    : "We deliver independent, methodologically grounded legal research that serves decision-making in public and private institutions — calibrated to international academic standards and the specificities of the Saudi system.";

  const attribution = lang === "ar" ? "ركيزة عمل المركز" : "The Center's working principle";

  return (
    <section
      data-testid="section-pull-band"
      data-theme-component="theme-b-pull"
      style={{ background: "var(--tb-paper-warm)" }}
    >
      <div className="mx-auto max-w-[1100px] px-6 md:px-12 lg:px-16 py-24 md:py-28 text-center">
        <Quote
          size={36}
          strokeWidth={1.2}
          className="mx-auto"
          style={{ color: "var(--tb-gold)", transform: lang === "ar" ? "scaleX(-1)" : "none" }}
        />
        <blockquote
          className="tb-display mt-8 max-w-[44ch] mx-auto"
          style={{
            fontSize: "clamp(1.5rem, 2.4vw, 2.05rem)",
            lineHeight: 1.45,
            fontWeight: 500,
            color: "var(--tb-navy-900)",
          }}
        >
          {text}
        </blockquote>
        <div className="mt-9 flex items-center justify-center gap-3">
          <span style={{ height: 1, width: 36, background: "var(--tb-gold)" }} />
          <span className="tb-overline" style={{ color: "var(--tb-gold-deep)" }}>
            {attribution}
          </span>
          <span style={{ height: 1, width: 36, background: "var(--tb-gold)" }} />
        </div>
      </div>
    </section>
  );
}

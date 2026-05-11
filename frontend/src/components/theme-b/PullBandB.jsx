import { Quote } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { getTextStyles, getTextAlign, getGradientOverlay } from "@/lib/sectionTypo";
import Reveal from "@/components/theme-b/Reveal";

/**
 * Theme B — Institutional Pull Band.
 * Sits between Mission/Vision and Objectives to break the section monotony.
 * Centered editorial pull-quote on warm paper background, refined gold accents.
 * Editable from /admin/home → "ركيزة عمل المركز" card.
 */
export default function PullBandB() {
  const { lang } = useLang();
  const { data: home } = useHomeContent();
  // Visibility — defaults to TRUE when admin hasn't explicitly hidden the section.
  const vs = home?.visible_sections;
  if (Array.isArray(vs) && vs.length > 0 && !vs.includes("pull_band")) return null;

  const text = home?.[`pull_band_text_${lang}`] || (lang === "ar"
    ? "نقدّم بحثاً قانونياً مستقلاً ومنهجياً، يخدم صناعة القرار في المؤسسات الحكومية والخاصة، وفق المعايير الأكاديمية الدولية وخصوصيات النظام السعودي."
    : "We deliver independent, methodologically grounded legal research that serves decision-making in public and private institutions — calibrated to international academic standards and the specificities of the Saudi system.");

  const attribution = home?.[`pull_band_attribution_${lang}`] || (lang === "ar"
    ? "ركيزة عمل المركز"
    : "The Center's working principle");
  const titleScale = home?.section_styles?.pull_band?.title_scale ?? 1;
  const tsText = getTextStyles(home, "pull_band", "text");
  const tsAttr = getTextStyles(home, "pull_band", "attribution");
  const alignText = getTextAlign(home, "pull_band", "text");
  const alignAttr = getTextAlign(home, "pull_band", "attribution");
  const gradStyle = getGradientOverlay(home, "pull_band");

  return (
    <section
      data-testid="section-pull-band"
      data-theme-component="theme-b-pull"
      className="relative isolate"
      style={{ backgroundColor: home?.section_styles?.pull_band?.bg_color || "var(--tb-paper-warm)" }}
    >
      {gradStyle.backgroundImage && (
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={gradStyle} />
      )}
      <div className="relative z-10 mx-auto max-w-[1100px] px-6 md:px-12 lg:px-16 py-24 md:py-28 text-center">
        <Quote
          size={36}
          strokeWidth={1.2}
          className="mx-auto"
          style={{ color: "var(--tb-gold)", transform: lang === "ar" ? "scaleX(-1)" : "none" }}
        />
        <blockquote
          data-testid="pull-band-text"
        >
          <Reveal
            variant="zoom"
            className="tb-display mt-8 max-w-[44ch] mx-auto block"
            style={{
              transitionDuration: "0.8s",
              fontSize: `calc(clamp(1.5rem, 2.4vw, 2.05rem) * ${titleScale} * ${tsText.sizeMul})`,
              lineHeight: 1.45,
              fontWeight: tsText.fontWeight ?? 500,
              color: tsText.color || "var(--tb-navy-900)",
              textAlign: alignText || undefined,
            }}
          >
            {text}
          </Reveal>
        </blockquote>
        {/* Centered gold rule — animates from center outward at delay 0.3s */}
        <Reveal
          variant="scaleX"
          className="mt-7 mx-auto block"
          style={{
            transitionDuration: "0.6s",
            transitionDelay: "0.3s",
            height: 1,
            width: 96,
            background: "var(--tb-gold)",
          }}
        />
        <div className="mt-9 flex items-center justify-center gap-3">
          <span style={{ height: 1, width: 36, background: "var(--tb-gold)" }} />
          <span
            className="tb-overline"
            style={{
              color: tsAttr.color || "var(--tb-gold-deep)",
              fontSize: tsAttr.sizeMul !== 1 ? `calc(0.78rem * ${tsAttr.sizeMul})` : undefined,
              fontWeight: tsAttr.fontWeight,
              textAlign: alignAttr || undefined,
            }}
          >
            {attribution}
          </span>
          <span style={{ height: 1, width: 36, background: "var(--tb-gold)" }} />
        </div>
      </div>
    </section>
  );
}

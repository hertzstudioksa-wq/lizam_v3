import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent, useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Theme B — Premium Editorial Hero (Nadeem-inspired refinement).
 * Centered text-only hero on deep navy. Single CTA. Generous breathing room.
 * No image panel, no chips — institutional gravitas through type and space.
 */
export default function HeroB() {
  const { lang, t, pick } = useLang();
  const { data: home } = useHomeContent();
  useSiteSettings();

  // Visibility — defaults to TRUE when the admin hasn't explicitly hidden the section.
  const vs = home?.visible_sections;
  if (Array.isArray(vs) && vs.length > 0 && !vs.includes("hero")) return null;

  const title = pick(home, "hero_title", "");
  const subtitle = pick(home, "hero_subtitle", "");
  const ctaPrimary = pick(home, "hero_cta_primary", "") || t("hero.explore");
  const ctaSecondary = pick(home, "hero_cta_secondary", "");
  const ctaPrimaryLink = home?.hero_cta_primary_link || "/publications";
  const ctaSecondaryLink = home?.hero_cta_secondary_link || "";
  const titleScale = home?.section_styles?.hero?.title_scale ?? 1;

  // Per-field typography overrides (size · weight · color) coming from
  // /admin/home → Hero card. Each field can be tuned independently. Falls
  // back to {} so the existing default visual is preserved when nothing is set.
  const ts = home?.section_styles?.hero?.text_styles || {};
  const tsOf = (key) => {
    const o = ts[key] || {};
    const out = {};
    if (typeof o.size === "number" && o.size > 0) out.__sizeMul = o.size;
    if (o.weight) out.fontWeight = Number(o.weight);
    if (o.color) out.color = o.color;
    return out;
  };
  const tsEyebrow = tsOf("eyebrow");
  const tsTitle = tsOf("title");
  const tsSubtitle = tsOf("subtitle");
  const tsCta1 = tsOf("cta_primary");
  const tsCta2 = tsOf("cta_secondary");

  // Eyebrow — admin override first, then sensible default
  const eyebrow = home?.[`hero_eyebrow_${lang}`] || (lang === "ar"
    ? "مركز بحثي مستقل · المملكة العربية السعودية"
    : "Independent Research Center · Kingdom of Saudi Arabia");

  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const [line1, line2] = (title || "").split("\n");

  return (
    <section
      id="hero"
      className="relative isolate pt-[120px] md:pt-[140px] pb-24 md:pb-28 overflow-hidden"
      style={{
        background: "var(--tb-navy-900)",
        color: "var(--tb-paper-base)",
        minHeight: "82vh",
      }}
      data-testid="hero-section"
      data-theme-component="theme-b-hero"
    >
      {/* Configurable hero media — read directly from home_content.section_styles.hero.bg */}
      {(() => {
        const bg = home?.section_styles?.hero?.bg;
        if (!bg || bg.enabled === false || !bg.url) return null;
        return (
          <>
            <img
              src={bg.url}
              alt={bg[`alt_${lang}`] || bg.alt_en || bg.alt_ar || ""}
              aria-hidden
              className="absolute inset-0 w-full h-full tb-ken-burns"
              style={{
                objectFit: "cover",
                objectPosition: `${bg.focal_x ?? 50}% ${bg.focal_y ?? 50}%`,
                zIndex: 0,
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `rgba(10, 17, 28, ${bg.overlay_opacity ?? 0.65})`,
                zIndex: 0,
              }}
            />
          </>
        );
      })()}

      {/* Subtle gold rule at very top under header */}
      <div
        aria-hidden
        style={{
          position: "absolute", top: 0, insetInlineStart: "50%", transform: "translateX(-50%)",
          width: 1, height: 80, background: "linear-gradient(180deg, var(--tb-gold) 0%, transparent 100%)",
          opacity: 0.5,
          zIndex: 5,
        }}
      />

      <div className="relative z-10 mx-auto max-w-[920px] px-6 md:px-10 text-center flex flex-col items-center justify-center" style={{ minHeight: "calc(82vh - 240px)" }}>
        {/* Eyebrow — falls in from above at t=0 */}
        <div className="tb-fall tb-delay-0 inline-flex items-center gap-3" data-testid="hero-eyebrow">
          <span style={{ height: 1, width: 28, background: "var(--tb-gold)" }} />
          <span
            className="tb-overline"
            style={{
              color: tsEyebrow.color || "var(--tb-gold-soft)",
              letterSpacing: "0.22em",
              fontSize: tsEyebrow.__sizeMul ? `calc(0.78rem * ${tsEyebrow.__sizeMul})` : undefined,
              fontWeight: tsEyebrow.fontWeight,
            }}
          >
            {eyebrow}
          </span>
          <span style={{ height: 1, width: 28, background: "var(--tb-gold)" }} />
        </div>

        {/* Title — slides up at t=0.15s */}
        <h1
          className="tb-display tb-up tb-delay-150 mt-12 mx-auto"
          style={{
            fontSize: `calc(clamp(2.8rem, 6.4vw, 5.4rem) * ${titleScale} * ${tsTitle.__sizeMul ?? 1})`,
            lineHeight: lang === "ar" ? 1.18 : 1.04,
            fontWeight: tsTitle.fontWeight ?? 500,
            letterSpacing: lang === "ar" ? "0" : "-0.018em",
            maxWidth: "18ch",
            color: tsTitle.color || "var(--tb-paper-base)",
          }}
          data-testid="hero-title"
        >
          <span style={{ display: "block" }}>{line1}</span>
          {line2 && (
            <span style={{ display: "block", color: tsTitle.color || "var(--tb-gold)" }}>{line2}</span>
          )}
        </h1>

        {/* Subtitle — slides up at t=0.3s */}
        {subtitle && (
          <p
            data-testid="hero-subtitle"
            className="tb-up tb-delay-300 mt-12 mx-auto"
            style={{
              color: tsSubtitle.color || "rgba(251, 250, 247, 0.78)",
              fontFamily: '"Thmanyah Serif Text", serif',
              fontSize: `calc(clamp(1.05rem, 1.3vw, 1.32rem) * ${tsSubtitle.__sizeMul ?? 1})`,
              fontWeight: tsSubtitle.fontWeight,
              lineHeight: 1.95,
              maxWidth: "60ch",
            }}
          >
            {subtitle}
          </p>
        )}

        {/* CTAs — slide up at t=0.45s */}
        <div className="mt-16 tb-up tb-delay-450 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={ctaPrimaryLink}
            className="inline-flex items-center gap-3 px-9 py-4 transition-all duration-400"
            style={{
              border: `1px solid ${tsCta1.color || "var(--tb-gold)"}`,
              color: tsCta1.color || "var(--tb-gold)",
              fontFamily: '"Thmanyah Sans", sans-serif',
              fontSize: `calc(14px * ${tsCta1.__sizeMul ?? 1})`,
              letterSpacing: "0.16em",
              textTransform: lang === "ar" ? "none" : "uppercase",
              fontWeight: tsCta1.fontWeight ?? 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = tsCta1.color || "var(--tb-gold)";
              e.currentTarget.style.color = "var(--tb-navy-900)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = tsCta1.color || "var(--tb-gold)";
            }}
            data-testid="hero-cta-primary"
          >
            <span>{ctaPrimary}</span>
            <Arrow size={15} strokeWidth={1.6} />
          </Link>
          {ctaSecondary && (
            <Link
              to={ctaSecondaryLink || "#about"}
              className="inline-flex items-center gap-2 px-7 py-4 transition-colors duration-400"
              style={{
                color: tsCta2.color || "rgba(251, 250, 247, 0.85)",
                fontFamily: '"Thmanyah Sans", sans-serif',
                fontSize: `calc(14px * ${tsCta2.__sizeMul ?? 1})`,
                letterSpacing: "0.14em",
                textTransform: lang === "ar" ? "none" : "uppercase",
                fontWeight: tsCta2.fontWeight ?? 500,
                borderBottom: "1px solid rgba(251, 250, 247, 0.35)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = tsCta2.color || "var(--tb-paper-base)"; e.currentTarget.style.borderBottomColor = "var(--tb-paper-base)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = tsCta2.color || "rgba(251, 250, 247, 0.85)"; e.currentTarget.style.borderBottomColor = "rgba(251, 250, 247, 0.35)"; }}
              data-testid="hero-cta-secondary"
            >
              <span>{ctaSecondary}</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

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

  const title = pick(home, "hero_title", "");
  const subtitle = pick(home, "hero_subtitle", "");
  const ctaPrimary = pick(home, "hero_cta_primary", "") || t("hero.explore");

  const eyebrow = lang === "ar"
    ? "مركز بحثي مستقل · المملكة العربية السعودية"
    : "Independent Research Center · Kingdom of Saudi Arabia";

  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const [line1, line2] = (title || "").split("\n");

  return (
    <section
      id="hero"
      className="relative pt-[120px] md:pt-[140px] pb-24 md:pb-28"
      style={{
        background: "var(--tb-navy-900)",
        color: "var(--tb-paper-base)",
        minHeight: "82vh",
      }}
      data-testid="hero-section"
      data-theme-component="theme-b-hero"
    >
      {/* Subtle gold rule at very top under header */}
      <div
        aria-hidden
        style={{
          position: "absolute", top: 0, insetInlineStart: "50%", transform: "translateX(-50%)",
          width: 1, height: 80, background: "linear-gradient(180deg, var(--tb-gold) 0%, transparent 100%)",
          opacity: 0.5,
        }}
      />

      <div className="mx-auto max-w-[920px] px-6 md:px-10 text-center flex flex-col items-center justify-center" style={{ minHeight: "calc(82vh - 240px)" }}>
        {/* Eyebrow */}
        <div className="tb-rise inline-flex items-center gap-3" data-testid="hero-eyebrow">
          <span style={{ height: 1, width: 28, background: "var(--tb-gold)" }} />
          <span
            className="tb-overline"
            style={{ color: "var(--tb-gold-soft)", letterSpacing: "0.22em" }}
          >
            {eyebrow}
          </span>
          <span style={{ height: 1, width: 28, background: "var(--tb-gold)" }} />
        </div>

        {/* Title */}
        <h1
          className="tb-display tb-rise tb-rise-d1 mt-12 mx-auto"
          style={{
            fontSize: "clamp(2.8rem, 6.4vw, 5.4rem)",
            lineHeight: lang === "ar" ? 1.18 : 1.04,
            fontWeight: 500,
            letterSpacing: lang === "ar" ? "0" : "-0.018em",
            maxWidth: "18ch",
            color: "var(--tb-paper-base)",
          }}
          data-testid="hero-title"
        >
          <span style={{ display: "block" }}>{line1}</span>
          {line2 && (
            <span style={{ display: "block", color: "var(--tb-gold)" }}>{line2}</span>
          )}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p
            data-testid="hero-subtitle"
            className="tb-rise tb-rise-d2 mt-12 mx-auto"
            style={{
              color: "rgba(251, 250, 247, 0.78)",
              fontFamily: '"Thmanyah Serif Text", serif',
              fontSize: "clamp(1.05rem, 1.3vw, 1.32rem)",
              lineHeight: 1.95,
              maxWidth: "60ch",
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Single CTA */}
        <div className="mt-16 tb-rise tb-rise-d3">
          <Link
            to="/publications"
            className="inline-flex items-center gap-3 px-9 py-4 transition-all duration-400"
            style={{
              border: "1px solid var(--tb-gold)",
              color: "var(--tb-gold)",
              fontFamily: '"Thmanyah Sans", sans-serif',
              fontSize: 14,
              letterSpacing: "0.16em",
              textTransform: lang === "ar" ? "none" : "uppercase",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--tb-gold)";
              e.currentTarget.style.color = "var(--tb-navy-900)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--tb-gold)";
            }}
            data-testid="hero-cta-primary"
          >
            <span>{ctaPrimary}</span>
            <Arrow size={15} strokeWidth={1.6} />
          </Link>
        </div>
      </div>
    </section>
  );
}

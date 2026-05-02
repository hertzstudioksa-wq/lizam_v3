import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent, useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Theme B — Premium Editorial Hero.
 * Single layered ivory composition (NOT split-screen). A massive serif display
 * headline anchors the page; a vertical issue marker sits on the leading edge;
 * an inset navy editorial block carries the lede + CTAs.
 * Subtle entrance with staggered delays. No SaaS gradients, no images.
 */
export default function HeroB() {
  const { lang, t, pick } = useLang();
  const { data: home } = useHomeContent();
  const { data: site } = useSiteSettings();

  const title = pick(home, "hero_title", "");
  const subtitle = pick(home, "hero_subtitle", "");
  const eyebrow = pick(home, "hero_eyebrow", "");
  const ctaPrimary = pick(home, "hero_cta_primary", "") || t("hero.explore");
  const ctaSecondary = pick(home, "hero_cta_secondary", "") || t("hero.contact");
  const siteNameAr = site?.site_name_ar || "مركز لزام للدراسات القانونية";
  const siteNameEn = site?.site_name_en || "LIZAM Center for Legal Research";

  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const [line1, line2] = (title || "").split("\n");

  return (
    <section
      id="hero"
      className="relative pt-[110px] md:pt-[140px] pb-20 md:pb-28"
      style={{ background: "var(--tb-paper-base)" }}
      data-testid="hero-section"
      data-theme-component="theme-b-hero"
    >
      {/* Vertical issue marker — leading edge */}
      <div className="hidden md:flex absolute top-[140px] bottom-20 start-6 lg:start-10 flex-col items-center gap-6 pointer-events-none">
        <span style={{ width: 1, flex: 1, background: "linear-gradient(to bottom, var(--tb-gold), transparent)" }} />
        <div
          className="text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "var(--tb-gold)", writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Volume I · 2026
        </div>
        <span style={{ width: 1, flex: 1, background: "linear-gradient(to top, var(--tb-gold), transparent)" }} />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-12 lg:px-20">
        {/* Eyebrow row */}
        <div className="tb-section-eyebrow tb-rise" data-testid="hero-eyebrow">
          <span className="rule" />
          <span className="tb-overline">{eyebrow || (lang === "ar" ? "مجلد ١ · إصدار ٢٠٢٦" : "Volume I · Edition 2026")}</span>
        </div>

        {/* Headline */}
        <h1
          className="tb-display tb-rise tb-rise-d1 mt-8 max-w-[18ch]"
          style={{
            fontSize: "clamp(2.6rem, 6.5vw, 5.25rem)",
            lineHeight: lang === "ar" ? 1.25 : 1.05,
            fontWeight: 500,
          }}
          data-testid="hero-title"
        >
          <span style={{ display: "block", color: "var(--tb-navy-900)" }}>{line1}</span>
          {line2 && (
            <span style={{ display: "block", color: "var(--tb-gold)" }}>{line2}</span>
          )}
        </h1>

        {/* Hairline */}
        <div className="mt-12 mb-10 max-w-[460px]" style={{ height: 1, background: "var(--tb-hairline)" }} />

        {/* Lede + CTAs in editorial two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start tb-rise tb-rise-d2">
          <div className="lg:col-span-7">
            <p
              data-testid="hero-subtitle"
              style={{
                fontFamily: '"Thmanyah Serif Text", "Source Serif 4", serif',
                fontSize: "clamp(1.05rem, 1.2vw, 1.2rem)",
                lineHeight: 1.95,
                color: "var(--tb-text)",
                maxWidth: "62ch",
              }}
            >
              {subtitle}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/publications"
                className="tb-btn-primary"
                data-testid="hero-cta-primary"
              >
                <span>{ctaPrimary}</span>
                <Arrow size={16} strokeWidth={1.6} />
              </Link>
              <Link
                to="/contact"
                className="tb-btn-secondary"
                data-testid="hero-cta-secondary"
              >
                <span>{ctaSecondary}</span>
              </Link>
            </div>
          </div>

          {/* Navy editorial block — institutional pairing */}
          <div className="lg:col-span-5">
            <div
              className="p-8 lg:p-10 relative tb-rise tb-rise-d3"
              style={{ background: "var(--tb-navy-900)", color: "var(--tb-paper-base)" }}
            >
              <span
                aria-hidden
                className="absolute top-0 start-0"
                style={{ width: 32, height: 1, background: "var(--tb-gold)" }}
              />
              <div className="text-[10px] tracking-[0.28em] uppercase mb-5" style={{ color: "var(--tb-gold-soft)" }}>
                {lang === "ar" ? "المركز البحثي" : "The Research Center"}
              </div>
              <p
                className="text-[20px] lg:text-[22px] leading-[1.55]"
                style={{ fontFamily: '"Thmanyah Serif Display", serif', color: "var(--tb-paper-base)" }}
              >
                {siteNameAr}
              </p>
              <p
                className="mt-3 text-[12.5px]"
                style={{
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(249, 247, 243, 0.7)",
                  fontFamily: '"Thmanyah Sans", sans-serif',
                }}
              >
                {siteNameEn}
              </p>

              {/* Issue meta rail */}
              <div className="mt-8 pt-6 grid grid-cols-2 gap-6" style={{ borderTop: "1px solid rgba(212, 185, 130, 0.22)" }}>
                <div>
                  <div className="text-[10px] tracking-[0.24em] uppercase" style={{ color: "var(--tb-gold-soft)" }}>
                    {lang === "ar" ? "مجلد" : "Volume"}
                  </div>
                  <div className="mt-2 text-3xl" style={{ fontFamily: '"Thmanyah Serif Display", serif', color: "var(--tb-paper-base)" }}>I</div>
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.24em] uppercase" style={{ color: "var(--tb-gold-soft)" }}>
                    {lang === "ar" ? "السنة" : "Year"}
                  </div>
                  <div className="mt-2 text-3xl tabular-nums" style={{ fontFamily: '"Thmanyah Serif Display", serif', color: "var(--tb-paper-base)" }}>2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent, useSiteSettings } from "@/hooks/useSiteSettings";
import { useImageAssets } from "@/hooks/useImageAssets";

/**
 * Theme B — Premium Editorial Hero (Round 2 refinement).
 * Split asymmetric composition with strong visual anchor (image panel).
 * No book/journal mimicry — institutional language only.
 * Layered: text column (5/12) + image panel (7/12) on desktop; stacked on mobile.
 */
export default function HeroB() {
  const { lang, t, pick } = useLang();
  const { data: home } = useHomeContent();
  useSiteSettings();
  const { bySlot } = useImageAssets();
  const heroImg = bySlot.hero_background;

  const title = pick(home, "hero_title", "");
  const subtitle = pick(home, "hero_subtitle", "");
  const ctaPrimary = pick(home, "hero_cta_primary", "") || t("hero.explore");
  const ctaSecondary = pick(home, "hero_cta_secondary", "") || t("hero.contact");

  // Institutional eyebrow — never journal/issue
  const eyebrow = lang === "ar"
    ? "مركز بحثي مستقل · المملكة العربية السعودية"
    : "Independent Research Center · Kingdom of Saudi Arabia";

  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const [line1, line2] = (title || "").split("\n");
  const imageUrl = heroImg?.active && heroImg?.url ? heroImg.url : null;
  const altText = heroImg?.[`alt_${lang}`] || heroImg?.alt_en || "";

  const focusAreas = [
    lang === "ar" ? "الدراسات التشريعية" : "Legislative studies",
    lang === "ar" ? "السياسات العامة" : "Public policy",
    lang === "ar" ? "الممارسات القضائية" : "Judicial practice",
    lang === "ar" ? "الشريعة الإسلامية" : "Islamic jurisprudence",
    lang === "ar" ? "المجالات الناشئة" : "Emerging fields",
  ];

  return (
    <section
      id="hero"
      className="relative pt-[100px] md:pt-[120px] pb-0"
      style={{ background: "var(--tb-paper-base)" }}
      data-testid="hero-section"
      data-theme-component="theme-b-hero"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch min-h-[640px] lg:min-h-[720px]">

          {/* TEXT COLUMN */}
          <div className="lg:col-span-5 flex flex-col justify-center pt-10 pb-16 lg:py-24">
            <div className="tb-section-eyebrow tb-rise" data-testid="hero-eyebrow">
              <span className="rule" />
              <span className="tb-overline">{eyebrow}</span>
            </div>

            <h1
              className="tb-display tb-rise tb-rise-d1 mt-8"
              style={{
                fontSize: "clamp(2.5rem, 5.2vw, 4.6rem)",
                lineHeight: lang === "ar" ? 1.18 : 1.04,
                fontWeight: 500,
                letterSpacing: lang === "ar" ? "0" : "-0.012em",
              }}
              data-testid="hero-title"
            >
              <span style={{ display: "block", color: "var(--tb-navy-900)" }}>{line1}</span>
              {line2 && (
                <span style={{ display: "block", color: "var(--tb-gold)" }}>{line2}</span>
              )}
            </h1>

            <div className="mt-10 mb-9 max-w-[420px]" style={{ height: 1, background: "var(--tb-hairline)" }} />

            <p
              data-testid="hero-subtitle"
              className="tb-rise tb-rise-d2 max-w-[58ch] tb-body-lg"
              style={{
                color: "var(--tb-text)",
                fontSize: "clamp(1.1rem, 1.25vw, 1.28rem)",
              }}
            >
              {subtitle}
            </p>

            <div className="mt-11 flex flex-wrap items-center gap-4 tb-rise tb-rise-d3">
              <Link to="/publications" className="tb-btn-primary" data-testid="hero-cta-primary">
                <span>{ctaPrimary}</span>
                <Arrow size={16} strokeWidth={1.6} />
              </Link>
              <Link to="/contact" className="tb-btn-secondary" data-testid="hero-cta-secondary">
                <span>{ctaSecondary}</span>
              </Link>
            </div>
          </div>

          {/* IMAGE PANEL — strong visual anchor */}
          <div className="lg:col-span-7 relative tb-rise tb-rise-d2">
            <div
              className="relative w-full h-full overflow-hidden"
              style={{
                minHeight: 420,
                borderRadius: "var(--tb-radius-lg)",
                background: imageUrl
                  ? `url(${imageUrl}) center/cover no-repeat`
                  : "linear-gradient(135deg, var(--tb-navy-900) 0%, var(--tb-navy-700) 100%)",
                boxShadow: "var(--tb-shadow-deep)",
              }}
              role="img"
              aria-label={altText}
            >
              {/* Tonal overlay for contrast and richness */}
              <div
                aria-hidden
                style={{
                  position: "absolute", inset: 0,
                  background: imageUrl
                    ? "linear-gradient(135deg, rgba(10, 17, 28, 0.55) 0%, rgba(10, 17, 28, 0.18) 45%, rgba(10, 17, 28, 0.55) 100%)"
                    : "none",
                }}
              />

              {/* Bottom-corner editorial caption */}
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 lg:p-10">
                <div
                  className="inline-flex items-center gap-3 px-4 py-2"
                  style={{
                    background: "rgba(251, 250, 247, 0.92)",
                    backdropFilter: "blur(6px)",
                    borderRadius: "var(--tb-radius-pill)",
                    border: "1px solid rgba(180, 145, 74, 0.4)",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--tb-gold)" }} />
                  <span
                    className="text-[12px]"
                    style={{
                      fontFamily: '"Thmanyah Sans", sans-serif',
                      color: "var(--tb-navy-900)",
                      letterSpacing: lang === "ar" ? "0" : "0.08em",
                      textTransform: lang === "ar" ? "none" : "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {lang === "ar" ? "بحث قانوني وتحليل مؤسسي" : "Legal research · Institutional analysis"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOCUS AREAS — refined topic chips below the hero, full width */}
        <div className="border-t mt-2 pt-10 pb-16" style={{ borderColor: "var(--tb-hairline)" }}>
          <div className="flex items-center gap-3 mb-6">
            <span style={{ height: 1, width: 28, background: "var(--tb-gold)" }} />
            <span className="tb-overline">{lang === "ar" ? "محاور العمل" : "Research focus"}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {focusAreas.map((label, i) => (
              <span
                key={i}
                className="tb-chip"
                data-testid={`focus-chip-${i + 1}`}
                style={{ fontSize: 13.5, padding: "0.6rem 1.1rem" }}
              >
                <span
                  className="tabular-nums"
                  style={{ color: "var(--tb-gold)", fontSize: 11, marginInlineEnd: 8 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

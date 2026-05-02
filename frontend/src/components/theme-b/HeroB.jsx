import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent, useSiteSettings } from "@/hooks/useSiteSettings";
import { useImageAssets } from "@/hooks/useImageAssets";

/**
 * Theme B — Premium Editorial Hero (refined Feb 2026).
 * Modern global research-institute aesthetic. NO book/journal/issue framing.
 * Atmospheric image with paper-tone overlay; large display headline anchors;
 * editorial summary block on the right (or below on mobile); refined CTAs.
 */
export default function HeroB() {
  const { lang, t, pick } = useLang();
  const { data: home } = useHomeContent();
  useSiteSettings();
  const { bySlot } = useImageAssets();
  const heroImg = bySlot.hero_background;

  const title = pick(home, "hero_title", "");
  const subtitle = pick(home, "hero_subtitle", "");
  // Eyebrow: prefer institutional phrasing over journal-issue mimicry.
  // If seeded content uses "Volume I / مجلد" framing, override with institutional copy.
  const seededEyebrow = pick(home, "hero_eyebrow", "");
  const isJournalEyebrow = /(volume|مجلد|edition|إصدار)/i.test(seededEyebrow || "");
  const eyebrow = isJournalEyebrow
    ? (lang === "ar" ? "مركز بحثي مستقل" : "Independent Research Center")
    : (seededEyebrow || (lang === "ar" ? "مركز بحثي مستقل" : "Independent Research Center"));
  const ctaPrimary = pick(home, "hero_cta_primary", "") || t("hero.explore");
  const ctaSecondary = pick(home, "hero_cta_secondary", "") || t("hero.contact");

  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const [line1, line2] = (title || "").split("\n");

  const imageUrl = heroImg?.active && heroImg?.url ? heroImg.url : null;

  return (
    <section
      id="hero"
      className="tb-image-section relative pt-[110px] md:pt-[150px] pb-20 md:pb-32"
      style={{
        background: "var(--tb-paper-base)",
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      data-testid="hero-section"
      data-theme-component="theme-b-hero"
    >
      {imageUrl && <div className="tb-overlay" />}

      <div className="tb-content relative mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16">
        {/* Eyebrow — kept short and editorial; no Volume/Year mimicry */}
        <div className="tb-section-eyebrow tb-rise" data-testid="hero-eyebrow">
          <span className="rule" />
          <span className="tb-overline">{eyebrow}</span>
        </div>

        {/* Headline */}
        <h1
          className="tb-display tb-rise tb-rise-d1 mt-8 max-w-[18ch]"
          style={{
            fontSize: "clamp(2.6rem, 6.5vw, 5.5rem)",
            lineHeight: lang === "ar" ? 1.22 : 1.04,
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
        <div className="mt-12 mb-12 max-w-[460px]" style={{ height: 1, background: "var(--tb-hairline)" }} />

        {/* Lede + CTAs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start tb-rise tb-rise-d2">
          <div className="lg:col-span-7">
            <p
              data-testid="hero-subtitle"
              style={{
                fontFamily: '"Thmanyah Serif Text", "Source Serif 4", serif',
                fontSize: "clamp(1.05rem, 1.2vw, 1.22rem)",
                lineHeight: 1.95,
                color: "var(--tb-text)",
                maxWidth: "62ch",
              }}
            >
              {subtitle}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/publications" className="tb-btn-primary" data-testid="hero-cta-primary">
                <span>{ctaPrimary}</span>
                <Arrow size={16} strokeWidth={1.6} />
              </Link>
              <Link to="/contact" className="tb-btn-secondary" data-testid="hero-cta-secondary">
                <span>{ctaSecondary}</span>
              </Link>
            </div>
          </div>

          {/* Editorial focus panel — research focus areas at-a-glance (no Volume/Issue) */}
          <aside className="lg:col-span-5 tb-rise tb-rise-d3">
            <div className="tb-panel">
              <div className="tb-section-eyebrow mb-5">
                <span className="rule" />
                <span className="tb-overline" style={{ color: "var(--tb-gold-deep)" }}>
                  {lang === "ar" ? "محاور العمل" : "Research focus"}
                </span>
              </div>
              <ul className="space-y-3.5">
                {[
                  lang === "ar" ? "الدراسات التشريعية" : "Legislative studies",
                  lang === "ar" ? "السياسات العامة والحوكمة" : "Public policy & governance",
                  lang === "ar" ? "الممارسات القضائية" : "Judicial practice",
                  lang === "ar" ? "الشريعة الإسلامية والنظم القانونية" : "Islamic jurisprudence & legal systems",
                  lang === "ar" ? "المجالات الناشئة" : "Emerging fields",
                ].map((label, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span
                      style={{
                        fontFamily: '"Thmanyah Sans", sans-serif',
                        fontSize: 11,
                        color: "var(--tb-gold)",
                        letterSpacing: "0.18em",
                        minWidth: 24,
                      }}
                      className="tabular-nums"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontFamily: '"Thmanyah Sans", sans-serif', fontSize: 15, color: "var(--tb-navy-900)" }}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

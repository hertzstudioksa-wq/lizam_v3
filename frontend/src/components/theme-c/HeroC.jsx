import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useImageAsset } from "@/hooks/useImageAssets";
import { useHomeContent } from "@/hooks/useSiteSettings";

const FALLBACK = "https://images.unsplash.com/photo-1633448927172-e87cdb5fa764?crop=entropy&cs=srgb&fm=jpg&q=85&w=2400";

export default function HeroC() {
  const { lang } = useLang();
  const home = useHomeContent();
  const heroImg = useImageAsset("theme_c_hero_cinematic");
  const bg = heroImg?.url || FALLBACK;

  const eyebrow = (lang === "ar" ? home?.hero_eyebrow_ar : home?.hero_eyebrow_en)
    || (lang === "ar" ? "مركز لزام للدراسات القانونية" : "LIZAM Center for Legal Research");
  const title = (lang === "ar" ? home?.hero_title_ar : home?.hero_title_en)
    || (lang === "ar" ? "بحث قانوني رصين\nلصناعة قرار أكثر نضجاً" : "Rigorous legal research\nfor a more considered policy");
  const subtitle = (lang === "ar" ? home?.hero_subtitle_ar : home?.hero_subtitle_en)
    || (lang === "ar"
      ? "مركز سعودي مستقل ينتج معرفة قانونية موثوقة في الدراسات والسياسات والحوكمة، ويدعم صنّاع القرار برؤى تحليلية رصينة."
      : "An independent Saudi center producing trusted legal scholarship in studies, policy and governance — supporting decision-makers with measured analysis.");
  const ctaPrimary = (lang === "ar" ? home?.hero_cta_primary_ar : home?.hero_cta_primary_en) || (lang === "ar" ? "استعراض الإصدارات" : "Browse publications");
  const ctaSecondary = (lang === "ar" ? home?.hero_cta_secondary_ar : home?.hero_cta_secondary_en) || (lang === "ar" ? "تواصل مع المركز" : "Contact the center");

  const titleLines = String(title).split(/\\n|\n/);

  return (
    <section
      className="tc-hero"
      style={{ backgroundImage: `url("${bg}")` }}
      data-testid="hero"
      data-theme-component="theme-c-hero"
    >
      <div className="tc-hero-grain" />

      {/* Content anchored to bottom-end (RTL → bottom-left for AR, bottom-right for EN) */}
      <div className="relative z-10 h-full min-h-[92vh] flex items-end pb-[88px] md:pb-[120px]">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14 w-full">
          <div className="max-w-[860px]">
            <div className="tc-eyebrow-light tc-fade-up">
              <span className="inline-block w-8 h-px align-middle me-3" style={{ background: "var(--tc-gold)" }} />
              {eyebrow}
            </div>
            <h1
              className="mt-7 text-[44px] md:text-[64px] lg:text-[80px] leading-[1.05] font-semibold tracking-tight tc-fade-up delay-1"
              style={{
                fontFamily: lang === "ar"
                  ? 'var(--lz-font-ar, "Thmanyah Serif Display"), "IBM Plex Sans Arabic", serif'
                  : '"Source Serif 4", "Thmanyah Serif Display", Georgia, serif',
                color: "var(--tc-ivory)",
              }}
              data-testid="hero-title"
            >
              {titleLines.map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h1>
            <p
              className="mt-8 max-w-[640px] text-[16px] md:text-[18px] leading-[1.7] tc-fade-up delay-2"
              style={{ color: "rgba(248,247,243,0.78)" }}
              data-testid="hero-subtitle"
            >
              {subtitle}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4 tc-fade-up delay-3">
              <Link to="/publications" className="tc-btn-primary" data-testid="hero-cta-primary">
                <span>{ctaPrimary}</span>
                <ArrowRight size={16} className={lang === "ar" ? "rotate-180" : ""} />
              </Link>
              <Link to="/contact" className="tc-btn-ghost-light" data-testid="hero-cta-secondary">
                {ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom marker / scroll affordance */}
      <div className="absolute z-10 bottom-7 inset-x-0 mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14 hidden md:flex items-center justify-between">
        <span className="tc-eyebrow-light">{lang === "ar" ? "المجلد الأول · 2026" : "Volume I · 2026"}</span>
        <span className="tc-eyebrow-light flex items-center gap-2">
          <span className="block w-12 h-px" style={{ background: "rgba(248,247,243,0.35)" }} />
          {lang === "ar" ? "تابع للأسفل" : "Continue"}
        </span>
      </div>
    </section>
  );
}

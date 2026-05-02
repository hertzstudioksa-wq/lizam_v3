import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent, useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Editorial, asymmetric, institutional hero.
 *
 * Left column (RTL: right) → Deep Navy paneling with a measured masthead,
 *   eyebrow volume/issue metadata, large bilingual headline, lede, two CTAs.
 * Right column (RTL: left) → paper-textured panel with a subtle geometric
 *   architectural image + a vertical editorial metadata rail (issue number,
 *   year, type, Arabic/English pairing).
 *
 * No SaaS tropes: no blobs, no gradients on the text, no floating cards.
 */
export default function Hero() {
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

  // Split headline by newline for a two-line editorial feel.
  const [line1, line2] = (title || "").split("\n");

  return (
    <section
      id="hero"
      className="relative pt-[78px] md:pt-[78px] animate-slow-reveal"
      data-testid="hero-section"
    >
      <div className="relative mx-auto max-w-[1500px] px-0 md:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[88vh] lg:min-h-[92vh]">
          {/* ---------- LEFT PANEL (Deep navy masthead) ---------- */}
          <div className="relative lg:col-span-7 bg-navy-deep text-ivory overflow-hidden">
            {/* Subtle geometric overlay */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.08] mix-blend-screen"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(184,155,94,0.55) 0.5px, transparent 1px), radial-gradient(circle at 80% 60%, rgba(184,155,94,0.4) 0.5px, transparent 1px)",
                backgroundSize: "42px 42px, 68px 68px",
              }}
            />
            {/* Thin vertical brass rule */}
            <div
              aria-hidden
              className="absolute top-10 bottom-10 lg:top-14 lg:bottom-14 start-0 w-px bg-gradient-to-b from-transparent via-brass/50 to-transparent"
            />

            <div className="relative h-full flex flex-col px-8 sm:px-12 lg:px-16 py-16 lg:py-24">
              {/* Top masthead */}
              <div className="flex items-center gap-4 text-ivory/55">
                <span className="h-px w-10 bg-brass" />
                <span className="lz-eyebrow text-ivory/70" data-testid="hero-eyebrow">
                  {eyebrow || (lang === "ar" ? "مجلد ١ · إصدار ٢٠٢٦" : "Volume I · Edition 2026")}
                </span>
              </div>

              {/* Spacer to push headline down slightly — editorial rhythm */}
              <div className="flex-1 min-h-[48px]" />

              {/* Headline */}
              <h1
                className="lz-display mb-6 lg:mb-8 animate-fade-up"
                style={{ animationDelay: "120ms", color: "#FAF9F6" }}
                data-testid="hero-title"
              >
                <span style={{ color: "#FAF9F6" }}>{line1}</span>
                {line2 && (
                  <>
                    <br />
                    <span style={{ color: "#CDB27A" }}>{line2}</span>
                  </>
                )}
              </h1>

              {/* Lede */}
              <p
                className="animate-fade-up"
                style={{
                  animationDelay: "240ms",
                  maxWidth: "56ch",
                  color: "rgba(250, 249, 246, 0.86)",
                  fontSize: "clamp(1rem, 1.1vw, 1.125rem)",
                  lineHeight: 1.85,
                }}
                data-testid="hero-subtitle"
              >
                {subtitle}
              </p>

              {/* CTAs */}
              <div
                className="mt-10 lg:mt-12 flex flex-wrap items-center gap-4 animate-fade-up"
                style={{ animationDelay: "360ms" }}
              >
                <Link
                  to="/publications"
                  className="lz-btn lz-btn-primary bg-brass hover:bg-brass-hover border-brass hover:border-brass-hover text-navy-deep"
                  data-testid="hero-cta-primary"
                >
                  <BookOpen size={16} strokeWidth={2} />
                  <span>{ctaPrimary}</span>
                  <Arrow size={16} strokeWidth={1.8} className="opacity-80" />
                </Link>
                <Link
                  to="/contact"
                  className="lz-btn bg-transparent text-ivory border border-ivory/25 hover:border-ivory/70 hover:bg-ivory/5"
                  data-testid="hero-cta-secondary"
                >
                  <span>{ctaSecondary}</span>
                </Link>
              </div>

              {/* Bottom institutional stamp */}
              <div className="mt-auto pt-16 flex flex-wrap items-end justify-between gap-6 text-ivory/55">
                <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em]">
                  <span className="h-px w-6 bg-ivory/30" />
                  <span className={lang === "ar" ? "font-arabic tracking-normal text-[13px]" : ""}>
                    {t("hero.established")}
                  </span>
                </div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-ivory/40">
                  LIZAM · <span className="text-brass/80">المركز البحثي</span>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- RIGHT PANEL (Paper + architectural detail) ---------- */}
          <div className="relative lg:col-span-5 bg-ivory lz-paper-texture overflow-hidden">
            {/* Architectural detail image (subtle — institutional, not cliché) */}
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center opacity-[0.22] mix-blend-multiply"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1716003797342-55f8fe2e395f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1800')",
              }}
            />
            {/* Corner crosshair marks — journal masthead feel */}
            <CornerMark className="top-6 start-6" />
            <CornerMark className="top-6 end-6" flipX />
            <CornerMark className="bottom-6 start-6" flipY />
            <CornerMark className="bottom-6 end-6" flipX flipY />

            {/* Metadata rail */}
            <div className="relative h-full flex flex-col justify-between p-8 sm:p-12 lg:p-14">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="lz-eyebrow text-navy/70 mb-2">
                    {lang === "ar" ? "مجلد" : "Volume"}
                  </div>
                  <div className="font-serif text-5xl lg:text-6xl text-navy-deep leading-none">
                    I
                  </div>
                </div>
                <div className="text-end">
                  <div className="lz-eyebrow text-navy/70 mb-2">
                    {lang === "ar" ? "سنة الإصدار" : "Year"}
                  </div>
                  <div className="font-serif text-2xl lg:text-3xl text-navy-deep tabular-nums">
                    2026
                  </div>
                </div>
              </div>

              {/* Bilingual pairing */}
              <div
                className="border-t border-navy/15 pt-6 mt-10 animate-fade-up"
                style={{ animationDelay: "480ms" }}
              >
                <p className="font-arabic text-[18px] lg:text-[20px] text-navy-deep leading-[1.75]">
                  {siteNameAr}
                </p>
                <p className="mt-2 font-sans text-[13px] uppercase tracking-[0.18em] text-navy/70">
                  {siteNameEn}
                </p>
              </div>

              {/* Fields of work micro-index */}
              <div className="mt-10 space-y-2.5 text-[13px] text-ink/70">
                <IndexRow num="01" label={lang === "ar" ? "الدراسات التشريعية" : "Legislative Studies"} />
                <IndexRow num="02" label={lang === "ar" ? "الممارسات القضائية" : "Judicial Practices"} />
                <IndexRow num="03" label={lang === "ar" ? "السياسات العامة والحوكمة" : "Public Policy & Governance"} />
                <IndexRow num="04" label={lang === "ar" ? "الشريعة الإسلامية" : "Islamic Jurisprudence"} />
                <IndexRow num="05" label={lang === "ar" ? "المجالات الناشئة" : "Emerging Fields"} />
              </div>

              {/* Footer stamp */}
              <div className="mt-10 pt-6 border-t border-navy/15 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-navy/55">
                <span>{lang === "ar" ? "سلسلة بحثية" : "Research Series"}</span>
                <span className="tabular-nums">№ 2026 / I</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thin bottom hairline rule */}
        <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14">
          <div className="lz-hairline mt-0" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- helpers -------------------------------- */

function CornerMark({ className = "", flipX = false, flipY = false }) {
  return (
    <span
      aria-hidden
      className={`absolute w-4 h-4 ${className}`}
      style={{
        transform: `${flipX ? "scaleX(-1)" : ""} ${flipY ? "scaleY(-1)" : ""}`.trim(),
      }}
    >
      <span className="block w-full h-px bg-navy/35" />
      <span className="block w-px h-full bg-navy/35 -mt-px" />
    </span>
  );
}

function IndexRow({ num, label }) {
  return (
    <div className="flex items-center justify-between gap-4 group">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[11px] tabular-nums text-navy/55 tracking-wider">{num}</span>
        <span className="h-px w-6 bg-navy/20 group-hover:bg-brass transition-colors duration-500" />
        <span className="truncate">{label}</span>
      </div>
    </div>
  );
}

import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { useImageAsset } from "@/hooks/useImageAssets";

const FALLBACK = "https://images.unsplash.com/photo-1732173200740-af8089795c90?crop=entropy&cs=srgb&fm=jpg&q=85&w=2000";

export default function AboutC() {
  const { lang } = useLang();
  const home = useHomeContent();
  const img = useImageAsset("theme_c_about_atmosphere");
  const src = img?.url || FALLBACK;

  const eyebrow = lang === "ar" ? "عن المركز" : "About the Center";
  const heading = (lang === "ar" ? home?.about_ar : home?.about_en)
    || (lang === "ar"
      ? "نُنتج معرفة قانونية تُعِين على فهم السياق وصياغة قرار."
      : "We produce legal scholarship that informs context and shapes considered decisions.");
  const body = lang === "ar" ? home?.about_extended_ar : home?.about_extended_en;

  return (
    <section
      className="relative py-24 md:py-32"
      style={{ background: "var(--tc-ivory)" }}
      data-testid="section-about"
      data-theme-component="theme-c-about"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
          {/* Atmospheric image — left on EN, right on AR via order */}
          <div className="lg:col-span-5 lg:order-1 order-2">
            <div className="relative w-full aspect-[4/5] overflow-hidden" style={{ background: "var(--tc-ivory-dark)" }}>
              <img
                src={src}
                alt={img?.alt_ar || ""}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="mt-5 flex items-center gap-4">
              <span className="tc-rule-gold" />
              <span className="text-[12px] tracking-[0.18em] uppercase" style={{ color: "var(--tc-text-muted)" }}>
                {lang === "ar" ? "مقرّه المملكة العربية السعودية" : "Based in the Kingdom of Saudi Arabia"}
              </span>
            </div>
          </div>

          {/* Headline column */}
          <div className="lg:col-span-7 lg:order-2 order-1">
            <div className="tc-overline">{eyebrow}</div>
            <h2
              className="mt-6 text-[36px] md:text-[44px] lg:text-[56px] leading-[1.15] font-semibold"
              style={{
                color: "var(--tc-navy)",
                fontFamily: lang === "ar"
                  ? 'var(--lz-font-ar, "Thmanyah Serif Display"), serif'
                  : '"Source Serif 4", serif',
              }}
              data-testid="about-heading"
            >
              {heading}
            </h2>
            {body && (
              <p
                className="mt-8 text-[16.5px] md:text-[17.5px] leading-[1.85] max-w-[60ch]"
                style={{ color: "var(--tc-text-muted)" }}
              >
                {body}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

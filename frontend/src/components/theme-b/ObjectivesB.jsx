import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { useImageAssets } from "@/hooks/useImageAssets";

/**
 * Theme B — Objectives (refined). Soft navy band, generous numerals, refined edges.
 * Optional background image with dark overlay (only if 'objectives_background' slot active).
 */
export default function ObjectivesB() {
  const { lang } = useLang();
  const { data: home } = useHomeContent();
  const { bySlot } = useImageAssets();
  if (!home) return null;
  const items = home.objectives || [];
  const bg = bySlot.objectives_background;
  const useBg = bg?.active && bg?.url;
  const titleScale = home?.section_styles?.objectives?.title_scale ?? 1;

  return (
    <section
      id="objectives"
      data-testid="section-objectives"
      data-theme-component="theme-b-objectives"
      className="tb-image-section"
      style={{
        background: useBg ? `url(${bg.url}) center/cover no-repeat` : undefined,
        backgroundColor: "var(--tb-navy-900)",
        color: "var(--tb-paper-base)",
      }}
    >
      {useBg && <div className="tb-overlay" style={{ background: "linear-gradient(180deg, rgba(10,17,28,0.86) 0%, rgba(10,17,28,0.74) 50%, rgba(10,17,28,0.92) 100%)" }} />}
      <div className="tb-content mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16 py-24 md:py-32">
        <div className="max-w-[800px]">
          <div className="tb-section-eyebrow">
            <span className="rule" />
            <span className="tb-overline" style={{ color: "var(--tb-gold-soft)" }}>
              {home[`objectives_eyebrow_${lang}`] || (lang === "ar" ? "الأهداف" : "Objectives")}
            </span>
          </div>
          <h2
            className="tb-display mt-7"
            style={{
              fontSize: "clamp(2rem, 3.6vw, 2.85rem)",
              lineHeight: 1.25,
              fontWeight: 500,
              color: "var(--tb-paper-base)",
              maxWidth: "26ch",
            }}
          >
            {lang === "ar" ? "خمسة محاور تقود برنامج المركز." : "Five priorities that shape our agenda."}
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-12">
          {items.map((o, i) => (
            <article
              key={o.id}
              className="group relative pt-8"
              style={{ borderTop: "1px solid rgba(212, 185, 130, 0.28)" }}
              data-testid={`objective-${i + 1}`}
            >
              <div className="flex items-baseline gap-6">
                <span
                  className="tabular-nums shrink-0 tb-figure"
                  style={{ fontSize: 44 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-[22px] md:text-[24px]"
                    style={{
                      fontFamily: '"Thmanyah Serif Display", serif',
                      color: "var(--tb-paper-base)",
                      fontWeight: 500,
                      lineHeight: 1.32,
                      fontSize: `calc(24px * ${titleScale})`,
                    }}
                  >
                    {o[`title_${lang}`]}
                  </h3>
                  <p
                    className="mt-4 max-w-[50ch]"
                    style={{
                      fontFamily: '"Thmanyah Serif Text", serif',
                      fontSize: 16,
                      lineHeight: 1.95,
                      color: "rgba(251, 250, 247, 0.78)",
                    }}
                  >
                    {o[`description_${lang}`]}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

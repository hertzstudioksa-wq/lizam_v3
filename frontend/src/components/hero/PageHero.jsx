import HeroMediaLayer from "@/components/hero/HeroMediaLayer";

/**
 * PageHero — compact cinematic band placed above internal pages
 * (Publications, About, Contact). Reuses the configured hero media for that
 * page (or falls back to `_default`).
 *
 * Does NOT change the existing page structure: pages can opt-in by rendering
 * <PageHero pageKey="..." title="..." kicker="..." /> at the very top of
 * their content tree.
 */
export default function PageHero({
  pageKey,
  kicker,
  title,
  subtitle,
  testid,
  minHeight = 360,
}) {
  return (
    <section
      data-testid={testid || `page-hero-${pageKey}`}
      data-theme-component="page-hero"
      className="relative isolate"
      style={{
        minHeight,
        background: "var(--tb-navy-900, #0A111C)",
        color: "var(--tb-paper-base, #FBFAF7)",
      }}
    >
      <HeroMediaLayer pageKey={pageKey} extendBehindHeader />

      <div className="relative z-10">
        <div
          className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16 flex flex-col justify-end"
          style={{ minHeight, paddingTop: 130, paddingBottom: 56 }}
        >
          {kicker && (
            <div className="inline-flex items-center gap-3">
              <span
                style={{
                  height: 1,
                  width: 30,
                  background: "var(--tb-gold, #B4914A)",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--tb-gold, #B4914A)",
                  fontWeight: 600,
                }}
              >
                {kicker}
              </span>
            </div>
          )}
          {title && (
            <h1
              className="mt-5"
              style={{
                fontFamily: '"Thmanyah Serif Display", "Source Serif 4", serif',
                fontSize: "clamp(1.85rem, 3.4vw, 2.85rem)",
                lineHeight: 1.2,
                fontWeight: 500,
                color: "var(--tb-paper-base, #FBFAF7)",
                maxWidth: "26ch",
              }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              className="mt-4"
              style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: "rgba(251, 250, 247, 0.82)",
                maxWidth: "60ch",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

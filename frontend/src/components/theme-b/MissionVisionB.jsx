import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";

/**
 * Theme B — Mission & Vision (v2: balanced, restrained).
 *
 * Design principles:
 *  - Eyebrow → heading → body type ramps in modest steps; nothing screams.
 *  - Section header is compact, not headline-of-the-page big.
 *  - Two equally-weighted cards with a subtle hairline border + small accent.
 *  - Tighter padding and content widths so the section doesn't dominate.
 *  - Uses the project's typography classes (tb-display, tb-overline) so
 *    Arabic font shaping is preserved on both LTR and RTL.
 */
export default function MissionVisionB() {
  const { lang, pick } = useLang();
  const { data: home } = useHomeContent();
  if (!home) return null;

  const mission = pick(home, "mission");
  const vision = pick(home, "vision");
  const mp = home[`mission_points_${lang}`] || [];
  const vp = home[`vision_points_${lang}`] || [];

  const Card = ({ index, kicker, title, body, points, testid, accentDark }) => (
    <article
      data-testid={testid}
      className="lz-mv-card relative h-full"
      style={{
        background: "var(--tb-paper-base)",
        border: "1px solid var(--tb-hairline)",
        borderRadius: 6,
        padding: "2.1rem 2.25rem 2.25rem",
        transition: "transform .45s cubic-bezier(.2,.7,.2,1), box-shadow .45s cubic-bezier(.2,.7,.2,1), border-color .45s ease",
      }}
    >
      {/* Top row: index + kicker + dot */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            style={{
              fontSize: 13,
              letterSpacing: "0.18em",
              color: "var(--tb-text-muted)",
              fontFeatureSettings: '"tnum" 1',
              fontWeight: 500,
            }}
          >
            {index}
          </span>
          <span style={{ height: 1, width: 26, background: "var(--tb-gold)" }} />
          <span className="tb-overline" style={{ fontSize: 13 }}>
            {kicker}
          </span>
        </div>
        <span
          aria-hidden
          className="lz-mv-dot"
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: 999,
            background: accentDark ? "var(--tb-navy-900)" : "var(--tb-gold)",
            opacity: 0.9,
            transition: "transform .45s ease",
          }}
        />
      </div>

      {/* Heading — modest, tagline-style */}
      <h3
        className="tb-display mt-6"
        style={{
          fontSize: "clamp(1.25rem, 1.5vw, 1.45rem)",
          lineHeight: 1.45,
          fontWeight: 500,
          maxWidth: "30ch",
        }}
      >
        {title}
      </h3>

      {/* Body */}
      <p
        className="mt-4"
        style={{
          fontSize: 16,
          lineHeight: 1.9,
          color: "var(--tb-text)",
          maxWidth: "60ch",
        }}
      >
        {body}
      </p>

      {/* Points */}
      {points.length > 0 && (
        <ul
          className="mt-7 space-y-3.5"
          style={{ borderTop: "1px solid var(--tb-hairline)", paddingTop: "1.25rem" }}
        >
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                aria-hidden
                style={{
                  marginTop: 11,
                  flexShrink: 0,
                  width: 14,
                  height: 1,
                  background: "var(--tb-gold)",
                }}
              />
              <span
                style={{
                  fontSize: 15,
                  lineHeight: 1.85,
                  color: "var(--tb-text)",
                }}
              >
                {p}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );

  return (
    <section
      id="mission-vision"
      data-testid="section-mission-vision"
      data-theme-component="theme-b-mission"
      style={{ background: "var(--tb-paper-deep)" }}
    >
      <style>{`
        .lz-mv-card { will-change: transform, box-shadow; }
        .lz-mv-card:hover {
          transform: translateY(-3px);
          border-color: var(--tb-gold) !important;
          box-shadow:
            0 1px 0 0 rgba(0,0,0,0.02),
            0 18px 36px -22px rgba(180, 145, 74, 0.35),
            0 6px 14px -10px rgba(14,26,44,0.10);
        }
        .lz-mv-card:hover .lz-mv-dot {
          transform: scale(1.45);
          background: var(--tb-gold) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .lz-mv-card, .lz-mv-card:hover, .lz-mv-dot { transition: none !important; transform: none !important; }
        }
      `}</style>
      <div className="mx-auto max-w-[1180px] px-6 md:px-10 lg:px-12 py-20 md:py-24">
        {/* Compact section intro */}
        <div className="max-w-[680px]">
          <div className="flex items-center gap-3">
            <span style={{ height: 1, width: 24, background: "var(--tb-gold)" }} />
            <span className="tb-overline">
              {lang === "ar" ? "المنطلقات" : "Foundations"}
            </span>
          </div>
          <h2
            className="tb-display mt-4"
            style={{
              fontSize: "clamp(1.6rem, 2.1vw, 2rem)",
              lineHeight: 1.32,
              fontWeight: 500,
              maxWidth: "32ch",
            }}
          >
            {lang === "ar"
              ? "ما الذي يقود عملنا، وإلى أين نتجه."
              : "What drives our work — and where we are headed."}
          </h2>
          <p
            className="mt-4"
            style={{
              fontSize: 15.5,
              lineHeight: 1.85,
              color: "var(--tb-text-muted)",
              maxWidth: "58ch",
            }}
          >
            {lang === "ar"
              ? "رسالتنا ورؤيتنا تحددان الأثر الذي نسعى إليه والمكانة التي نطمح لبلوغها."
              : "Our mission and vision define the impact we pursue and the standing we aspire to."}
          </p>
        </div>

        {/* Two equal-weight cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-7 items-stretch">
          <Card
            index="01"
            kicker={lang === "ar" ? "الرسالة" : "Mission"}
            title={
              lang === "ar"
                ? "بحث قانوني رصين يخدم الحوكمة والسياسات."
                : "Rigorous legal research in the service of governance."
            }
            body={mission}
            points={mp}
            testid="block-mission"
          />
          <Card
            index="02"
            kicker={lang === "ar" ? "الرؤية" : "Vision"}
            title={
              lang === "ar"
                ? "مرجع موثوق للدراسات القانونية في المملكة."
                : "A trusted reference for legal studies in the Kingdom."
            }
            body={vision}
            points={vp}
            testid="block-vision"
            accentDark
          />
        </div>
      </div>
    </section>
  );
}

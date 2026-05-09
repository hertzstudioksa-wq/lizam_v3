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
      className="relative h-full"
      style={{
        background: "var(--tb-paper-base)",
        border: "1px solid var(--tb-hairline)",
        borderRadius: 6,
        padding: "1.85rem 2rem 2rem",
      }}
    >
      {/* Top row: index + kicker + dot */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              color: "var(--tb-text-muted)",
              fontFeatureSettings: '"tnum" 1',
            }}
          >
            {index}
          </span>
          <span style={{ height: 1, width: 22, background: "var(--tb-gold)" }} />
          <span className="tb-overline">{kicker}</span>
        </div>
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: 999,
            background: accentDark ? "var(--tb-navy-900)" : "var(--tb-gold)",
            opacity: 0.9,
          }}
        />
      </div>

      {/* Heading — modest, tagline-style */}
      <h3
        className="tb-display mt-5"
        style={{
          fontSize: "clamp(1.05rem, 1.25vw, 1.225rem)",
          lineHeight: 1.45,
          fontWeight: 500,
          maxWidth: "30ch",
        }}
      >
        {title}
      </h3>

      {/* Body */}
      <p
        className="mt-3.5"
        style={{
          fontSize: 14.5,
          lineHeight: 1.85,
          color: "var(--tb-text)",
          maxWidth: "60ch",
        }}
      >
        {body}
      </p>

      {/* Points */}
      {points.length > 0 && (
        <ul
          className="mt-6 space-y-3"
          style={{ borderTop: "1px solid var(--tb-hairline)", paddingTop: "1.1rem" }}
        >
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                aria-hidden
                style={{
                  marginTop: 10,
                  flexShrink: 0,
                  width: 12,
                  height: 1,
                  background: "var(--tb-gold)",
                }}
              />
              <span
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.78,
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
              fontSize: "clamp(1.4rem, 1.9vw, 1.8rem)",
              lineHeight: 1.35,
              fontWeight: 500,
              maxWidth: "32ch",
            }}
          >
            {lang === "ar"
              ? "ما الذي يقود عملنا، وإلى أين نتجه."
              : "What drives our work — and where we are headed."}
          </h2>
          <p
            className="mt-3.5"
            style={{
              fontSize: 14.5,
              lineHeight: 1.8,
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
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 items-stretch">
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

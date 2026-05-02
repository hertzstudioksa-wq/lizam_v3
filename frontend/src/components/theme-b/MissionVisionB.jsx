import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";

/**
 * Theme B — Mission & Vision (refined).
 * Single elegant heading per block — no awkward double-labeling.
 * Two paired editorial blocks with a soft warm panel for emphasis,
 * gold rule, refined hierarchy, no rigid book mimicry.
 */
export default function MissionVisionB() {
  const { lang, pick } = useLang();
  const { data: home } = useHomeContent();
  if (!home) return null;

  const mission = pick(home, "mission");
  const vision = pick(home, "vision");
  const mp = home[`mission_points_${lang}`] || [];
  const vp = home[`vision_points_${lang}`] || [];

  const Block = ({ kicker, title, body, points, testid, dark }) => (
    <article
      className={dark ? "tb-panel-dark" : "tb-panel"}
      data-testid={testid}
      style={{ padding: "2.25rem 2rem 2rem" }}
    >
      <div className="flex items-center gap-3">
        <span
          style={{ height: 1, width: 28, background: "var(--tb-gold)" }}
        />
        <span
          className="tb-overline"
          style={{ color: "var(--tb-gold)" }}
        >
          {kicker}
        </span>
      </div>
      <h3
        className="tb-display mt-6 max-w-[26ch]"
        style={{
          fontSize: "clamp(1.7rem, 2.6vw, 2.15rem)",
          lineHeight: 1.3,
          fontWeight: 500,
          color: dark ? "var(--tb-paper-base)" : "var(--tb-navy-900)",
        }}
      >
        {title}
      </h3>
      <p
        className="mt-6 max-w-[58ch]"
        style={{
          fontFamily: '"Thmanyah Serif Text", serif',
          fontSize: 16.5,
          lineHeight: 1.95,
          color: dark ? "rgba(247, 244, 238, 0.86)" : "var(--tb-text)",
        }}
      >
        {body}
      </p>
      {points.length > 0 && (
        <ul className="mt-7 space-y-3.5">
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-4 max-w-[60ch]">
              <span
                style={{
                  marginTop: 12,
                  height: 1,
                  width: 22,
                  background: "var(--tb-gold)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: '"Thmanyah Sans", sans-serif',
                  fontSize: 14.5,
                  lineHeight: 1.85,
                  color: dark ? "rgba(247, 244, 238, 0.78)" : "var(--tb-text)",
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
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16 py-24 md:py-32">
        {/* Section intro — single eyebrow + heading, NO repeated labels */}
        <div className="max-w-[820px]">
          <div className="tb-section-eyebrow">
            <span className="rule" />
            <span className="tb-overline">{lang === "ar" ? "المنطلقات" : "Foundations"}</span>
          </div>
          <h2
            className="tb-display mt-7 max-w-[26ch]"
            style={{
              fontSize: "clamp(2rem, 3.4vw, 2.85rem)",
              lineHeight: 1.28,
              fontWeight: 500,
            }}
          >
            {lang === "ar"
              ? "ما الذي يقود عملنا، وإلى أين نتجه."
              : "What drives our work — and where we are headed."}
          </h2>
        </div>

        {/* Two blocks side by side with contrast: mission warm panel, vision dark panel */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          <Block
            kicker={lang === "ar" ? "الرسالة" : "Mission"}
            title={lang === "ar" ? "بحث قانوني رصين يخدم الحوكمة." : "Rigorous legal research that serves governance."}
            body={mission}
            points={mp}
            testid="block-mission"
          />
          <Block
            kicker={lang === "ar" ? "الرؤية" : "Vision"}
            title={lang === "ar" ? "مرجع موثوق للدراسات القانونية في المملكة." : "A trusted reference for legal studies in the Kingdom."}
            body={vision}
            points={vp}
            testid="block-vision"
            dark
          />
        </div>
      </div>
    </section>
  );
}

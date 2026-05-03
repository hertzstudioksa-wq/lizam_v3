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
      style={{ padding: "2.75rem 2.5rem 2.5rem" }}
    >
      <div className="flex items-center gap-3">
        <span style={{ height: 1, width: 32, background: "var(--tb-gold)" }} />
        <span className="tb-overline" style={{ color: "var(--tb-gold)" }}>{kicker}</span>
      </div>
      <h3
        className="tb-display mt-7 max-w-[26ch]"
        style={{
          fontSize: "clamp(1.85rem, 2.8vw, 2.35rem)",
          lineHeight: 1.28,
          fontWeight: 500,
          color: dark ? "var(--tb-paper-base)" : "var(--tb-navy-900)",
        }}
      >
        {title}
      </h3>
      <p
        className="mt-7 max-w-[58ch] tb-body-lg"
        style={{
          color: dark ? "rgba(251, 250, 247, 0.88)" : "var(--tb-text)",
        }}
      >
        {body}
      </p>
      {points.length > 0 && (
        <ul className="mt-9 space-y-5">
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-4 max-w-[60ch]">
              <span
                style={{
                  marginTop: 14,
                  height: 1,
                  width: 24,
                  background: "var(--tb-gold)",
                  flexShrink: 0,
                }}
              />
              <span
                className="tb-list-item"
                style={{
                  color: dark ? "rgba(251, 250, 247, 0.82)" : "var(--tb-text)",
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
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16 py-28 md:py-36">
        {/* Section intro */}
        <div className="max-w-[820px]">
          <div className="tb-section-eyebrow">
            <span className="rule" />
            <span className="tb-overline">{lang === "ar" ? "المنطلقات" : "Foundations"}</span>
          </div>
          <h2
            className="tb-display mt-7 max-w-[28ch]"
            style={{
              fontSize: "clamp(2.1rem, 3.6vw, 3rem)",
              lineHeight: 1.24,
              fontWeight: 500,
            }}
          >
            {lang === "ar"
              ? "ما الذي يقود عملنا، وإلى أين نتجه."
              : "What drives our work — and where we are headed."}
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
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

import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";

/** Theme B — Mission & Vision: paired editorial blocks with gold rules. */
export default function MissionVisionB() {
  const { lang, pick } = useLang();
  const { data: home } = useHomeContent();
  if (!home) return null;

  const mission = pick(home, "mission");
  const vision = pick(home, "vision");
  const mp = home[`mission_points_${lang}`] || [];
  const vp = home[`vision_points_${lang}`] || [];

  const Block = ({ eyebrow, headline, body, points, testid }) => (
    <article className="lg:col-span-6" data-testid={testid}>
      <div className="tb-section-eyebrow">
        <span className="rule" />
        <span className="tb-overline">{eyebrow}</span>
      </div>
      <h3
        className="tb-display mt-8 max-w-[28ch]"
        style={{ fontSize: "clamp(1.6rem, 2.6vw, 2.1rem)", lineHeight: 1.35, fontWeight: 500 }}
      >
        {headline}
      </h3>
      <p
        className="mt-6 max-w-[56ch]"
        style={{
          fontFamily: '"Thmanyah Serif Text", serif',
          fontSize: 16.5,
          lineHeight: 1.95,
          color: "var(--tb-text)",
        }}
      >
        {body}
      </p>
      {points.length > 0 && (
        <ul className="mt-8 space-y-4">
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-4 max-w-[58ch]">
              <span style={{ marginTop: 14, height: 1, width: 22, background: "var(--tb-gold)", flexShrink: 0 }} />
              <span style={{ fontFamily: '"Thmanyah Sans", sans-serif', fontSize: 14.5, lineHeight: 1.9, color: "var(--tb-text)" }}>
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
      style={{ background: "var(--tb-paper-base)" }}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20 relative">
          <Block
            eyebrow={lang === "ar" ? "الرسالة" : "Mission"}
            headline={lang === "ar" ? "رسالتنا" : "Our mission"}
            body={mission}
            points={mp}
            testid="block-mission"
          />
          {/* Vertical divider */}
          <span
            aria-hidden
            className="hidden lg:block absolute top-0 bottom-0 left-1/2"
            style={{ width: 1, background: "var(--tb-hairline)" }}
          />
          <Block
            eyebrow={lang === "ar" ? "الرؤية" : "Vision"}
            headline={lang === "ar" ? "رؤيتنا" : "Our vision"}
            body={vision}
            points={vp}
            testid="block-vision"
          />
        </div>
      </div>
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-20">
        <div style={{ height: 1, background: "var(--tb-hairline)" }} />
      </div>
    </section>
  );
}

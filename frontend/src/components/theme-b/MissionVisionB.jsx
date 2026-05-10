import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { getTextStyles } from "@/lib/sectionTypo";

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
  // Admin-controlled bg from /admin/home → Mission card.
  // No legacy fallback — section uses solid color when no image is set.
  const bg = home?.section_styles?.mission?.bg;
  const hasBg = bg?.enabled !== false && !!bg?.url;
  const overlayOpacity = typeof bg?.overlay_opacity === "number" ? bg.overlay_opacity : 0;
  if (!home) return null;
  // Visibility — placed AFTER all hooks (Mission card in /admin/home controls this combined band).
  const vs = home?.visible_sections;
  if (Array.isArray(vs) && vs.length > 0 && !vs.includes("mission")) return null;

  const mission = pick(home, "mission");
  const vision = pick(home, "vision");
  const mp = home[`mission_points_${lang}`] || [];
  const vp = home[`vision_points_${lang}`] || [];
  const titleScale = home?.section_styles?.mission?.title_scale ?? 1;
  const tsEyebrow = getTextStyles(home, "mission", "eyebrow");
  const tsMissionText = getTextStyles(home, "mission", "mission_text");
  const tsVisionText = getTextStyles(home, "mission", "vision_text");
  const tsMissionPts = getTextStyles(home, "mission", "mission_points");
  const tsVisionPts = getTextStyles(home, "mission", "vision_points");

  const Card = ({ index, kicker, title, body, points, testid, tsBody, tsPts }) => (
    <article
      data-testid={testid}
      className="tb-card lz-mv-card flex flex-col h-full"
      style={{ padding: "2.1rem 2.25rem 2.25rem" }}
    >
      {/* Top row: index + kicker + dot */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="tabular-nums"
            style={{
              fontFamily: '"Thmanyah Sans", sans-serif',
              fontSize: 11,
              color: "var(--tb-gold)",
              letterSpacing: "0.22em",
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
          className="lz-mv-dot inline-flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--tb-radius-pill)",
            background: "var(--tb-gold-faint)",
            color: "var(--tb-gold-deep)",
            fontFamily: '"Thmanyah Sans", sans-serif',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          {kicker.charAt(0)}
        </span>
      </div>

      {/* Heading */}
      <h3
        className="mt-7 text-[19px] md:text-[21px]"
        style={{
          fontFamily: '"Thmanyah Serif Display", serif',
          color: "var(--tb-navy-900)",
          fontWeight: 500,
          lineHeight: 1.4,
          maxWidth: "30ch",
          fontSize: `calc(21px * ${titleScale})`,
        }}
      >
        {title}
      </h3>

      {/* Body */}
      <p
        className="mt-4"
        style={{
          fontFamily: '"Thmanyah Sans", sans-serif',
          fontSize: tsBody.sizeMul !== 1 ? `calc(15px * ${tsBody.sizeMul})` : 15,
          lineHeight: 1.9,
          color: tsBody.color || "var(--tb-text-muted)",
          fontWeight: tsBody.fontWeight,
          maxWidth: "60ch",
        }}
      >
        {body}
      </p>

      {/* Points */}
      {points.length > 0 && (
        <ul
          className="mt-7 space-y-3.5"
          style={{ borderTop: "1px solid var(--tb-hairline-soft)", paddingTop: "1.25rem" }}
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
                  fontFamily: '"Thmanyah Sans", sans-serif',
                  fontSize: tsPts.sizeMul !== 1 ? `calc(14.5px * ${tsPts.sizeMul})` : 14.5,
                  lineHeight: 1.85,
                  color: tsPts.color || "var(--tb-text)",
                  fontWeight: tsPts.fontWeight,
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
      className="relative isolate overflow-hidden"
      style={{ background: "var(--tb-paper-deep)" }}
    >
      {hasBg && (
        <>
          <img
            src={bg.url}
            alt={bg.alt_ar || bg.alt_en || ""}
            aria-hidden
            className="absolute inset-0 w-full h-full"
            style={{
              objectFit: "cover",
              objectPosition: `${bg.focal_x ?? 50}% ${bg.focal_y ?? 50}%`,
              zIndex: 0,
            }}
          />
          {overlayOpacity > 0 && (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: `rgba(249, 247, 243, ${overlayOpacity})`, zIndex: 0 }}
            />
          )}
        </>
      )}
      <div className="relative z-10 mx-auto max-w-[1180px] px-6 md:px-10 lg:px-12 py-20 md:py-24">
        {/* Compact section intro */}
        <div className="max-w-[680px]">
          <div className="flex items-center gap-3">
            <span style={{ height: 1, width: 24, background: "var(--tb-gold)" }} />
            <span
              className="tb-overline"
              style={{
                color: tsEyebrow.color,
                fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
                fontWeight: tsEyebrow.fontWeight,
              }}
            >
              {home[`mission_eyebrow_${lang}`] || (lang === "ar" ? "المنطلقات" : "Foundations")}
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
            tsBody={tsMissionText}
            tsPts={tsMissionPts}
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
            tsBody={tsVisionText}
            tsPts={tsVisionPts}
          />
        </div>
      </div>
    </section>
  );
}

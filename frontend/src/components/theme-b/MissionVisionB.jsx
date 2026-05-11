import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { useInView } from "@/hooks/useInView";
import { getTextStyles, getTextAlign, getGradientOverlay } from "@/lib/sectionTypo";

/**
 * Theme B — Mission & Vision (split v4, fully linkable).
 *
 * Visual: full-bleed split into two 50/50 halves wrapped in <Link to="/about">.
 *   • Physical LEFT (dark navy)   → Mission
 *   • Physical RIGHT (cream)      → Vision
 *   • Below the split, a centered outline CTA (also → /about).
 *
 * Text alignment intentionally "pulls apart" toward the seam to reinforce the
 * split — under RTL the right-side panel aligns LEFT and the left-side panel
 * aligns RIGHT; under LTR the directions reverse to match Western reading flow.
 *
 * Hover: a soft veil + a small "اقرأ أكثر ←" caption fades in at the bottom
 * of the half the cursor is over. The whole half is clickable (Link).
 *
 * Animation: each half slides ±50px and fades in once on first viewport entry.
 *
 * Admin contract is untouched — same `home_content` keys + per-field typo
 * overrides for `eyebrow / mission_text / vision_text`.
 */

/** Pick first sentence or first 130 chars, whichever is shorter. */
function lede(text) {
  if (!text) return "";
  const s = String(text).trim();
  const m = s.match(/^[\s\S]*?[.!?؟](\s|$)/);
  const first = m ? m[0].trim() : s;
  return first.length > 130 ? first.slice(0, 130).trimEnd() + "…" : first;
}

function Half({
  side, lang, eyebrowText, title, body, ts, tsEyebrow, dark, anim, testid, bgColor, alignOverride,
}) {
  const [hover, setHover] = useState(false);
  // Reversed alignment — text now pulls TOWARD the outer edges (away from the
  // central seam). Goal: each half feels self-contained and the split reads
  // more decisively as two distinct columns.
  //   • RTL: left half → align left,  right half → align right
  //   • LTR: left half → align right, right half → align left  (per spec)
  // Admin per-field alignment override (if set) takes precedence.
  const defaultAlign = lang === "ar"
    ? (side === "left" ? "left" : "right")
    : (side === "left" ? "right" : "left");
  const align = alignOverride || defaultAlign;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  // Background: admin-controlled override > default theme color
  const defaultBg = dark ? "var(--tb-navy-900)" : "var(--tb-paper-base)";
  return (
    <Link
      to="/about"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative block group focus:outline-none"
      style={{
        background: bgColor || defaultBg,
        color: dark ? "var(--tb-paper-base)" : "var(--tb-navy-900)",
        borderInlineStart: side === "right" ? "1px solid var(--tb-hairline)" : undefined,
        textAlign: align,
        minHeight: "clamp(420px, 56vh, 620px)",
        cursor: "pointer",
        transition: "background-color 0.4s ease-out",
        ...anim,
      }}
      data-testid={testid}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="relative h-full flex flex-col px-7 md:px-14 lg:px-20 py-20 md:py-28 lg:py-32">
        {/* Eyebrow */}
        <div
          className="flex items-center gap-3"
          style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}
        >
          <span style={{ height: 1, width: 28, background: "var(--tb-gold)" }} />
          <span
            className="tb-overline"
            style={{
              color: tsEyebrow.color || (dark ? "var(--tb-gold-soft)" : "var(--tb-gold-deep)"),
              letterSpacing: "0.22em",
              fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
              fontWeight: tsEyebrow.fontWeight,
            }}
          >
            {eyebrowText}
          </span>
        </div>

        {/* Heading */}
        <h3
          className="tb-display mt-8"
          style={{
            fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
            lineHeight: 1.32,
            fontWeight: 500,
            maxWidth: "26ch",
            color: dark ? "var(--tb-paper-base)" : "var(--tb-navy-900)",
            marginInline: align === "right" ? "auto 0" : "0 auto",
          }}
        >
          {title}
        </h3>

        {/* Short lede */}
        <p
          className="mt-7"
          style={{
            fontFamily: '"Thmanyah Serif Text", serif',
            fontSize: ts.sizeMul !== 1 ? `calc(1.05rem * ${ts.sizeMul})` : "1.05rem",
            lineHeight: 1.95,
            color: ts.color || (dark ? "rgba(251, 250, 247, 0.82)" : "var(--tb-text-muted)"),
            fontWeight: ts.fontWeight,
            maxWidth: "48ch",
            marginInline: align === "right" ? "auto 0" : "0 auto",
          }}
        >
          {lede(body)}
        </p>

        {/* Hover veil + read-more caption (fades in only on hover) */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: dark ? "rgba(180, 145, 74, 0.06)" : "rgba(10, 17, 28, 0.04)",
            opacity: hover ? 1 : 0,
            transition: "opacity 0.35s ease-out",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-8 flex pointer-events-none"
          style={{
            justifyContent: "center",
            opacity: hover ? 1 : 0,
            transform: hover ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.35s ease-out, transform 0.35s ease-out",
          }}
        >
          <span
            className="inline-flex items-center gap-2"
            style={{
              fontFamily: '"Thmanyah Sans", sans-serif',
              fontSize: 13,
              letterSpacing: "0.14em",
              color: dark ? "var(--tb-gold)" : "var(--tb-navy-900)",
              fontWeight: 500,
              textTransform: lang === "ar" ? "none" : "uppercase",
            }}
          >
            <span>{lang === "ar" ? "اقرأ أكثر" : "Read more"}</span>
            <Arrow size={13} strokeWidth={1.6} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function MissionVisionB() {
  const { lang, pick } = useLang();
  const { data: home } = useHomeContent();
  const [animRef, inView] = useInView({ threshold: 0.18 });

  if (!home) return null;
  const vs = home?.visible_sections;
  if (Array.isArray(vs) && vs.length > 0 && !vs.includes("mission")) return null;

  const mission = pick(home, "mission");
  const vision = pick(home, "vision");
  const tsEyebrow = getTextStyles(home, "mission", "eyebrow");
  const tsMission = getTextStyles(home, "mission", "mission_text");
  const tsVision = getTextStyles(home, "mission", "vision_text");
  // Per-half background color overrides — saved from /admin/home → Mission card.
  const missionBg = home?.section_styles?.mission?.mission_bg || "";
  const visionBg = home?.section_styles?.mission?.vision_bg || "";
  // Per-field alignment overrides
  const alignMissionText = getTextAlign(home, "mission", "mission_text");
  const alignVisionText = getTextAlign(home, "mission", "vision_text");
  const gradStyle = getGradientOverlay(home, "mission");

  // Heading texts (kept as before — not separately editable in CMS).
  const missionTitle =
    lang === "ar"
      ? "بحث قانوني رصين يخدم الحوكمة والسياسات."
      : "Rigorous legal research in the service of governance.";
  const visionTitle =
    lang === "ar"
      ? "مرجع موثوق للدراسات القانونية في المملكة."
      : "A trusted reference for legal studies in the Kingdom.";

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const leftAnim = {
    transform: inView ? "translateX(0)" : "translateX(-50px)",
    opacity: inView ? 1 : 0,
    transition: `transform 0.7s ${ease}, opacity 0.7s ease-out`,
  };
  const rightAnim = {
    transform: inView ? "translateX(0)" : "translateX(50px)",
    opacity: inView ? 1 : 0,
    transition: `transform 0.7s ${ease}, opacity 0.7s ease-out`,
  };

  return (
    <section
      id="mission-vision"
      ref={animRef}
      data-testid="section-mission-vision"
      data-theme-component="theme-b-mission"
      className="relative isolate"
      style={{ backgroundColor: "var(--tb-paper-base)" }}
    >
      {gradStyle.backgroundImage && (
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ ...gradStyle, zIndex: 3 }} />
      )}
      {/* `direction: ltr` on the grid keeps Mission visually LEFT and Vision
       *  visually RIGHT regardless of page direction. Each half restores its
       *  own text dir below. */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 items-stretch relative z-10"
        style={{ direction: "ltr" }}
        data-testid="mv-split"
      >
        <Half
          side="left"
          lang={lang}
          dark
          eyebrowText={lang === "ar" ? "الرسالة" : "Mission"}
          title={missionTitle}
          body={mission}
          ts={tsMission}
          tsEyebrow={tsEyebrow}
          anim={leftAnim}
          testid="block-mission"
          bgColor={missionBg}
          alignOverride={alignMissionText}
        />
        <Half
          side="right"
          lang={lang}
          dark={false}
          eyebrowText={lang === "ar" ? "الرؤية" : "Vision"}
          title={visionTitle}
          body={vision}
          ts={tsVision}
          tsEyebrow={tsEyebrow}
          anim={rightAnim}
          testid="block-vision"
          bgColor={visionBg}
          alignOverride={alignVisionText}
        />
      </div>
    </section>
  );
}

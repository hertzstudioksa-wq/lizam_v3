import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { useInView } from "@/hooks/useInView";
import { getTextStyles } from "@/lib/sectionTypo";

/**
 * Theme B — Mission & Vision (split layout v3).
 *
 * Visual: full-width section split into two equal halves (50/50).
 *   Left  → dark navy panel hosting MISSION
 *   Right → cream paper panel hosting VISION
 * Below both halves, a centered outline CTA to /about.
 *
 * Notes:
 *   - Backed by the same `home_content` data as before. No props/keys/admin
 *     touchpoints changed. Only JSX/CSS reshaped.
 *   - The dynamic `home_content` mission/vision body is preserved exactly;
 *     only a short lede is rendered (first sentence or first 120 chars).
 *   - Section-typo overrides (size · weight · color) still apply through
 *     getTextStyles() for `eyebrow / mission_text / vision_text`.
 *   - On first scroll into view, the left half slides in from -40px and the
 *     right half from +40px. Uses IntersectionObserver — no extra library.
 */

/** Pick first sentence or first 120 chars, whichever is shorter. */
function lede(text) {
  if (!text) return "";
  const s = String(text).trim();
  // Sentence-end detection: Arabic period (.), Latin period, !, ?, Arabic question mark.
  const m = s.match(/^[\s\S]*?[.!?؟](\s|$)/);
  const first = m ? m[0].trim() : s;
  return first.length > 120 ? first.slice(0, 120).trimEnd() + "…" : first;
}

export default function MissionVisionB() {
  const { lang, pick } = useLang();
  const { data: home } = useHomeContent();
  const [animRef, inView] = useInView({ threshold: 0.18 });

  if (!home) return null;
  // Visibility — placed AFTER all hooks (hook rules).
  const vs = home?.visible_sections;
  if (Array.isArray(vs) && vs.length > 0 && !vs.includes("mission")) return null;

  const mission = pick(home, "mission");
  const vision = pick(home, "vision");
  const tsEyebrow = getTextStyles(home, "mission", "eyebrow");
  const tsMissionText = getTextStyles(home, "mission", "mission_text");
  const tsVisionText = getTextStyles(home, "mission", "vision_text");

  // Titles are not stored in CMS as separate fields (intentional) — preserved
  // from the previous implementation verbatim.
  const missionTitle =
    lang === "ar"
      ? "بحث قانوني رصين يخدم الحوكمة والسياسات."
      : "Rigorous legal research in the service of governance.";
  const visionTitle =
    lang === "ar"
      ? "مرجع موثوق للدراسات القانونية في المملكة."
      : "A trusted reference for legal studies in the Kingdom.";

  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  // Transition timing — 0.6s ease-out, fires once.
  const baseTrans = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease-out";
  const leftStyle = {
    transform: inView ? "translateX(0)" : "translateX(-40px)",
    opacity: inView ? 1 : 0,
    transition: baseTrans,
  };
  const rightStyle = {
    transform: inView ? "translateX(0)" : "translateX(40px)",
    opacity: inView ? 1 : 0,
    transition: baseTrans,
  };

  return (
    <section
      id="mission-vision"
      ref={animRef}
      data-testid="section-mission-vision"
      data-theme-component="theme-b-mission"
      className="relative isolate"
      style={{ background: "var(--tb-paper-base)" }}
    >
      {/* Split halves
       *   We force `direction: ltr` on the grid itself so DOM order maps to
       *   visual left → right regardless of the page's `dir` attribute.
       *   Inside each panel we restore the active language direction so
       *   Arabic text aligns naturally. This guarantees: Mission stays on
       *   the physical LEFT (dark) and Vision on the physical RIGHT (cream)
       *   under both AR-RTL and EN-LTR.
       */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 items-stretch"
        style={{ direction: "ltr" }}
        data-testid="mv-split"
      >
        {/* LEFT HALF (physical) — Mission on deep navy */}
        <div
          dir={lang === "ar" ? "rtl" : "ltr"}
          className="relative px-7 md:px-14 lg:px-20 py-20 md:py-28 lg:py-32 flex flex-col"
          style={{
            background: "var(--tb-navy-900)",
            color: "var(--tb-paper-base)",
            minHeight: "clamp(420px, 56vh, 620px)",
            ...leftStyle,
          }}
          data-testid="block-mission"
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span style={{ height: 1, width: 28, background: "var(--tb-gold)" }} />
            <span
              className="tb-overline"
              style={{
                color: tsEyebrow.color || "var(--tb-gold-soft)",
                letterSpacing: "0.22em",
                fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
                fontWeight: tsEyebrow.fontWeight,
              }}
            >
              {lang === "ar" ? "الرسالة" : "Mission"}
            </span>
          </div>

          {/* Main heading */}
          <h3
            className="tb-display mt-8"
            style={{
              fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
              lineHeight: 1.32,
              fontWeight: 500,
              maxWidth: "26ch",
              color: "var(--tb-paper-base)",
            }}
          >
            {missionTitle}
          </h3>

          {/* Short lede */}
          <p
            className="mt-7 max-w-[48ch]"
            style={{
              fontFamily: '"Thmanyah Serif Text", serif',
              fontSize: tsMissionText.sizeMul !== 1 ? `calc(1.05rem * ${tsMissionText.sizeMul})` : "1.05rem",
              lineHeight: 1.95,
              color: tsMissionText.color || "rgba(251, 250, 247, 0.82)",
              fontWeight: tsMissionText.fontWeight,
            }}
          >
            {lede(mission)}
          </p>
        </div>

        {/* RIGHT HALF (physical) — Vision on cream paper */}
        <div
          dir={lang === "ar" ? "rtl" : "ltr"}
          className="relative px-7 md:px-14 lg:px-20 py-20 md:py-28 lg:py-32 flex flex-col"
          style={{
            background: "var(--tb-paper-base)",
            color: "var(--tb-navy-900)",
            minHeight: "clamp(420px, 56vh, 620px)",
            borderInlineStart: "1px solid var(--tb-hairline)",
            ...rightStyle,
          }}
          data-testid="block-vision"
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span style={{ height: 1, width: 28, background: "var(--tb-gold)" }} />
            <span
              className="tb-overline"
              style={{
                color: tsEyebrow.color || "var(--tb-gold-deep)",
                letterSpacing: "0.22em",
                fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
                fontWeight: tsEyebrow.fontWeight,
              }}
            >
              {lang === "ar" ? "الرؤية" : "Vision"}
            </span>
          </div>

          {/* Main heading */}
          <h3
            className="tb-display mt-8"
            style={{
              fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
              lineHeight: 1.32,
              fontWeight: 500,
              maxWidth: "26ch",
              color: "var(--tb-navy-900)",
            }}
          >
            {visionTitle}
          </h3>

          {/* Short lede */}
          <p
            className="mt-7 max-w-[48ch]"
            style={{
              fontFamily: '"Thmanyah Serif Text", serif',
              fontSize: tsVisionText.sizeMul !== 1 ? `calc(1.05rem * ${tsVisionText.sizeMul})` : "1.05rem",
              lineHeight: 1.95,
              color: tsVisionText.color || "var(--tb-text-muted)",
              fontWeight: tsVisionText.fontWeight,
            }}
          >
            {lede(vision)}
          </p>
        </div>
      </div>

      {/* Centered CTA — full-width band below the split */}
      <div
        className="flex items-center justify-center py-14 md:py-16"
        style={{ background: "var(--tb-paper-deep)" }}
      >
        <Link
          to="/about"
          className="inline-flex items-center gap-3 px-9 py-4 transition-all duration-300"
          style={{
            border: "1px solid var(--tb-navy-900)",
            color: "var(--tb-navy-900)",
            fontFamily: '"Thmanyah Sans", sans-serif',
            fontSize: 14,
            letterSpacing: "0.14em",
            textTransform: lang === "ar" ? "none" : "uppercase",
            fontWeight: 500,
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--tb-navy-900)";
            e.currentTarget.style.color = "var(--tb-paper-base)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--tb-navy-900)";
          }}
          data-testid="mv-cta-about"
        >
          <span>{lang === "ar" ? "للتعرف أكثر على المركز" : "Learn more about the center"}</span>
          <Arrow size={15} strokeWidth={1.6} />
        </Link>
      </div>
    </section>
  );
}

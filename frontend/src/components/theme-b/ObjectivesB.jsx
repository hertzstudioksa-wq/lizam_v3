import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { useImageAssets } from "@/hooks/useImageAssets";
import { useInView, useScrollProgress } from "@/hooks/useInView";
import { getTextStyles, getTextAlign } from "@/lib/sectionTypo";

/**
 * Theme B — Objectives (vertical timeline v3).
 *
 * Layout: two columns.
 *   ⟶ Left column (≈20%) is a sticky vertical label "الأهداف / Objectives"
 *     in gold serif, set in vertical-rl writing mode for editorial gravitas.
 *   ⟶ Right column (≈80%) hosts a vertical timeline: a thin gold rail on the
 *     left edge with dot markers; each marker has 01·02·… + objective title +
 *     a single-sentence lede (max 100 chars).
 *
 * Animations (Intersection-Observer driven — no extra library):
 *   • The gold rail fills from top to bottom as the section scrolls
 *     (scaleY 0 → 1, transform-origin top), bound to scroll progress.
 *   • Each item fades in + translateX(+20px → 0) on first intersection.
 *
 * Backend / admin contract is unchanged. Same `home.objectives` array, same
 * /admin/home eyebrow + per-item typo overrides.
 */

/** Single-sentence (or 100-char) summary. */
function lede(text) {
  if (!text) return "";
  const s = String(text).trim();
  const m = s.match(/^[\s\S]*?[.!?؟](\s|$)/);
  const first = m ? m[0].trim() : s;
  return first.length > 100 ? first.slice(0, 100).trimEnd() + "…" : first;
}

function TimelineItem({ obj, index, lang, tsItemTitle, tsItemDesc, alignItemTitle, alignItemDesc }) {
  const [ref, inView] = useInView({ threshold: 0.35 });
  const trans = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease-out, background-color 0.2s ease-out";

  return (
    <li
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(30px)",
        transition: trans,
        transitionDelay: `${index * 100}ms`,
      }}
      data-testid={`objective-${index + 1}`}
    >
      <Link
        to="/about"
        className="group relative block ps-12 md:ps-14 py-3 -my-3 transition-all duration-200"
        style={{
          color: "inherit",
          borderRadius: 4,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(180, 145, 74, 0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Dot on the rail — scales 1.4 on hover */}
        <span
          aria-hidden
          className="absolute top-5 transition-transform duration-200 group-hover:scale-[1.4]"
          style={{
            insetInlineStart: -7,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "var(--tb-gold)",
            boxShadow: "0 0 0 4px rgba(180, 145, 74, 0.16)",
          }}
        />
        {/* Content wrapper that nudges sideways on hover */}
        <div
          className="transition-transform duration-200 group-hover:-translate-x-[5px]"
          style={{}}
        >
          <div className="flex items-baseline gap-4">
            <span
              className="tabular-nums shrink-0"
              style={{
                fontFamily: '"Thmanyah Sans", sans-serif',
                fontSize: 13,
                color: "var(--tb-gold-deep)",
                letterSpacing: lang === "ar" ? "0.02em" : "0.18em",
                fontFeatureSettings: '"tnum" 1',
                minWidth: 28,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3
              className="text-[20px] md:text-[22px]"
              style={{
                fontFamily: '"Thmanyah Serif Display", serif',
                color: tsItemTitle.color || "var(--tb-navy-900)",
                fontWeight: tsItemTitle.fontWeight ?? 500,
                lineHeight: 1.32,
                fontSize: tsItemTitle.sizeMul !== 1 ? `calc(22px * ${tsItemTitle.sizeMul})` : undefined,
                textAlign: alignItemTitle || undefined,
              }}
            >
              {obj[`title_${lang}`]}
            </h3>
          </div>
          <p
            className="mt-3 ps-[44px] max-w-[58ch]"
            style={{
              fontFamily: '"Thmanyah Serif Text", serif',
              fontSize: tsItemDesc.sizeMul !== 1 ? `calc(15.5px * ${tsItemDesc.sizeMul})` : 15.5,
              lineHeight: 1.9,
              color: tsItemDesc.color || "var(--tb-text-muted)",
              fontWeight: tsItemDesc.fontWeight,
              textAlign: alignItemDesc || "justify",
              textAlignLast: "right",
              whiteSpace: "pre-line",
            }}
          >
            {obj[`description_${lang}`]}
          </p>
        </div>
      </Link>
    </li>
  );
}

export default function ObjectivesB() {
  const { lang } = useLang();
  const { data: home } = useHomeContent();
  const { bySlot } = useImageAssets();
  const [railRef, scrollProgress] = useScrollProgress();

  // For English: measure aside height and scale "Objectives" to fill it.
  // For Arabic: keep a fixed elegant size (no stretch needed).
  const asideRef = React.useRef(null);
  const labelRef = React.useRef(null);
  React.useEffect(() => {
    const label = labelRef.current;
    if (!label) return;

    // Arabic — fixed size, no dynamic fitting
    if (lang === "ar") {
      label.style.fontSize = "clamp(4.5rem, 10vw, 8.5rem)";
      return;
    }

    // English — fit to fill the aside height
    function fit() {
      const aside = asideRef.current;
      if (!aside || !label) return;
      const h = aside.clientHeight;
      if (!h) return;
      label.style.fontSize = "6rem";
      const w = label.scrollWidth;
      if (!w) return;
      const newSize = (h / w) * 6;
      label.style.fontSize = `${newSize}rem`;
    }
    fit();
    const ro = new ResizeObserver(fit);
    if (asideRef.current) ro.observe(asideRef.current);
    return () => ro.disconnect();
  }, [home, lang]);

  if (!home) return null;
  // Visibility — placed AFTER all hooks (hook rules).
  const vs = home?.visible_sections;
  if (Array.isArray(vs) && vs.length > 0 && !vs.includes("objectives")) return null;

  const items = home.objectives || [];
  const sec = home?.section_styles?.objectives?.bg;
  const useSec = sec?.enabled !== false && sec?.url;
  const legacy = bySlot.objectives_background;
  const bg = useSec ? sec : legacy;
  const useBg = (useSec && sec.url) || (legacy?.active && legacy?.url);
  const tsEyebrow = getTextStyles(home, "objectives", "eyebrow");
  const tsItemTitle = getTextStyles(home, "objectives", "item_title");
  const tsItemDesc = getTextStyles(home, "objectives", "item_desc");
  // Per-field alignment overrides
  const alignEyebrow = getTextAlign(home, "objectives", "eyebrow");
  const alignItemTitle = getTextAlign(home, "objectives", "item_title");
  const alignItemDesc = getTextAlign(home, "objectives", "item_desc");
  // Diagonal accent gradient — applied on the section by default to give
  // Objectives a warmer, layered look. Admins can change the accent color
  // via /admin/home → Objectives card. Empty/missing ⇒ default brass-gold.
  const sectionBgColor = home?.section_styles?.objectives?.bg_color || "var(--tb-paper-base)";
  const accentColor = home?.section_styles?.objectives?.gradient_accent || "#8B6914";
  const gradientStyle = {
    backgroundImage: `linear-gradient(to bottom left, transparent 60%, ${accentColor}40 100%)`,
  };

  return (
    <section
      id="objectives"
      ref={railRef}
      data-testid="section-objectives"
      data-theme-component="theme-b-objectives"
      className="relative isolate"
      style={{
        backgroundColor: sectionBgColor,
        backgroundImage: useBg ? `url(${bg.url})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Diagonal gradient accent overlay — soft brass-gold in the
          bottom-left corner. Sits above the bg color (and below the content). */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ ...gradientStyle, zIndex: 1 }}
        data-testid="objectives-gradient-accent"
      />
      {useBg && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "rgba(251, 250, 247, 0.92)", zIndex: 0 }}
        />
      )}
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16 py-24 md:py-32">
        {/* Section eyebrow + heading (above the 2-col layout) */}
        <div className="max-w-[680px]">
          <div className="flex items-center gap-3">
            <span style={{ height: 1, width: 28, background: "var(--tb-gold)" }} />
            <span
              className="tb-overline"
              style={{
                color: tsEyebrow.color || "var(--tb-gold-deep)",
                letterSpacing: lang === "ar" ? "0.02em" : "0.22em",
                fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
                fontWeight: tsEyebrow.fontWeight,
                textAlign: alignEyebrow || undefined,
              }}
            >
              {home[`objectives_eyebrow_${lang}`] || (lang === "ar" ? "الأهداف" : "Objectives")}
            </span>
          </div>
          <h2
            className="tb-display mt-6"
            style={{
              fontSize: "clamp(1.85rem, 3.2vw, 2.6rem)",
              lineHeight: 1.28,
              fontWeight: 500,
              color: "var(--tb-navy-900)",
              maxWidth: "26ch",
            }}
          >
            {home[`objectives_title_${lang}`] || (lang === "ar" ? "خمسة محاور تقود برنامج المركز." : "Five priorities that shape our agenda.")}
          </h2>
        </div>

        {/* 2-col layout — sticky label + timeline */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-[20%_80%] gap-10 md:gap-12 items-start">
          {/* Vertical label — runs the FULL height of the timeline column
              (no longer sticky). Implementation note: we deliberately avoid
              `writing-mode: vertical-rl` because it breaks Arabic ligatures
              (each letter renders in isolated form). Instead we lay out a
              regular horizontal span and rotate it 90° around its center —
              Arabic shaping stays intact and the letters connect naturally. */}
          <aside ref={asideRef} className="hidden md:block self-stretch" style={{ position: "relative", overflow: "hidden" }}>
            <div
              data-testid="objectives-sticky-label"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
              }}
            >
              {/* Inner rotation box. width=column height (rotated, so visually
                  the rotated span occupies the *column* vertical axis). The
                  rotated span's natural rendered width then becomes vertical. */}
              <div
                style={{
                  // For both AR and EN we use the same rotation; the word reads
                  // top → bottom which is the most graceful pairing with a
                  // vertical timeline.
                  transform: "rotate(-90deg)",
                  transformOrigin: "center",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  // Use a width that — when rotated — fills the column height.
                  // The trick: an absolutely-positioned flex parent (above)
                  // centers this block; we set a min-width via the font size
                  // and letter-spacing so the rotated text reaches edge-to-edge.
                }}
              >
                <span
                  ref={labelRef}
                  style={{
                    fontFamily: '"Thmanyah Serif Display", serif',
                    fontSize: "6rem", // overwritten by JS fit()
                    fontWeight: 500,
                    lineHeight: 1,
                    color: "var(--tb-gold)",
                    letterSpacing: lang === "ar" ? "0.06em" : "0.18em",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lang === "ar" ? "الأهداف" : "Objectives"}
                </span>
              </div>
            </div>
          </aside>

          {/* Timeline column */}
          <div className="relative">
            {/* Rail track (faint background line) */}
            <span
              aria-hidden
              className="absolute top-0 bottom-0"
              style={{
                insetInlineStart: 0,
                width: 2,
                background: "var(--tb-gold-faint)",
              }}
            />
            {/* Rail fill (animated by scroll progress) */}
            <span
              aria-hidden
              className="absolute top-0 bottom-0"
              style={{
                insetInlineStart: 0,
                width: 2,
                background: "linear-gradient(180deg, var(--tb-gold) 0%, var(--tb-gold-deep) 100%)",
                transformOrigin: "top",
                transform: `scaleY(${scrollProgress.toFixed(3)})`,
                transition: "transform 80ms linear",
              }}
              data-testid="objectives-rail-fill"
            />

            <ol className="relative space-y-14 md:space-y-16">
              {items.map((obj, i) => (
                <TimelineItem
                  key={obj.id || i}
                  obj={obj}
                  index={i}
                  lang={lang}
                  tsItemTitle={tsItemTitle}
                  tsItemDesc={tsItemDesc}
                  alignItemTitle={alignItemTitle}
                  alignItemDesc={alignItemDesc}
                />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

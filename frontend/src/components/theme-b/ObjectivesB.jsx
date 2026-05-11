import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { useImageAssets } from "@/hooks/useImageAssets";
import { useInView, useScrollProgress } from "@/hooks/useInView";
import { getTextStyles } from "@/lib/sectionTypo";

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

function TimelineItem({ obj, index, lang, tsItemTitle, tsItemDesc }) {
  const [ref, inView] = useInView({ threshold: 0.35 });
  const trans = "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.55s ease-out";
  const offset = lang === "ar" ? "-20px" : "20px";

  return (
    <li
      ref={ref}
      className="relative ps-12 md:ps-14"
      style={{
        transform: inView ? "translateX(0)" : `translateX(${offset})`,
        opacity: inView ? 1 : 0,
        transition: trans,
        transitionDelay: `${index * 60}ms`,
      }}
      data-testid={`objective-${index + 1}`}
    >
      {/* Dot on the rail */}
      <span
        aria-hidden
        className="absolute top-2"
        style={{
          insetInlineStart: -7,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "var(--tb-gold)",
          boxShadow: "0 0 0 4px rgba(180, 145, 74, 0.16)",
        }}
      />
      <div className="flex items-baseline gap-4">
        <span
          className="tabular-nums shrink-0"
          style={{
            fontFamily: '"Thmanyah Sans", sans-serif',
            fontSize: 13,
            color: "var(--tb-gold-deep)",
            letterSpacing: "0.18em",
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
        }}
      >
        {lede(obj[`description_${lang}`])}
      </p>
    </li>
  );
}

export default function ObjectivesB() {
  const { lang } = useLang();
  const { data: home } = useHomeContent();
  const { bySlot } = useImageAssets();
  const [railRef, scrollProgress] = useScrollProgress();

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

  return (
    <section
      id="objectives"
      ref={railRef}
      data-testid="section-objectives"
      data-theme-component="theme-b-objectives"
      className="relative isolate overflow-hidden"
      style={{
        background: useBg ? `url(${bg.url}) center/cover no-repeat` : "var(--tb-paper-base)",
        backgroundColor: useBg ? "var(--tb-paper-base)" : undefined,
      }}
    >
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
                letterSpacing: "0.22em",
                fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
                fontWeight: tsEyebrow.fontWeight,
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
            {lang === "ar" ? "خمسة محاور تقود برنامج المركز." : "Five priorities that shape our agenda."}
          </h2>
        </div>

        {/* 2-col layout — sticky label + timeline */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-[20%_80%] gap-10 md:gap-12 items-start">
          {/* Sticky label */}
          <aside className="hidden md:block">
            <div
              className="sticky top-32"
              style={{ minHeight: 160 }}
              data-testid="objectives-sticky-label"
            >
              <div
                className="inline-flex"
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  fontFamily: '"Thmanyah Serif Display", serif',
                  fontSize: "clamp(3rem, 5vw, 4.4rem)",
                  fontWeight: 500,
                  lineHeight: 1,
                  color: "var(--tb-gold)",
                  letterSpacing: lang === "ar" ? "0.04em" : "0.06em",
                }}
              >
                {lang === "ar" ? "الأهداف" : "Objectives"}
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
                />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

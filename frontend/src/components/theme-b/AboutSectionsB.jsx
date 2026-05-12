/**
 * Theme-B section components for the dedicated /about page.
 * Each section reads from /api/public/about-content and honors:
 *   - section_styles[key].bg          (image + focal + overlay)
 *   - section_styles[key].bg_color    (flat background color)
 *   - section_styles[key].gradient_accent (corner gradient)
 *   - section_styles[key].text_styles (per-field size/weight/color)
 *   - section_styles[key].text_aligns (per-field text-align)
 *
 * Visibility & order are driven by about.visible_sections[].
 */
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Linkedin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { getTextStyles, getTextAlign, getGradientOverlay } from "@/lib/sectionTypo";
import { useInView } from "@/hooks/useInView";
import Reveal from "@/components/theme-b/Reveal";


/** ────────────────────────────────────────────────────────────────
 * Shared helpers
 * ──────────────────────────────────────────────────────────────── */
function SectionShell({ id, sectionKey, about, children, dark = false, paddingY = "py-24 md:py-32" }) {
  const s = about?.section_styles?.[sectionKey] || {};
  const bgColor = s.bg_color || (dark ? "var(--tb-navy-900)" : "var(--tb-paper-base)");
  const bg = s.bg;
  const hasBg = bg && bg.enabled !== false && bg.url;
  const gradStyle = getGradientOverlay(about, sectionKey);
  return (
    <section
      id={id}
      data-testid={`about-section-${id}`}
      data-theme-component={`about-${id}`}
      className={`relative isolate overflow-hidden ${paddingY}`}
      style={{ backgroundColor: bgColor, color: dark ? "var(--tb-paper-base)" : undefined }}
    >
      {hasBg && (
        <>
          <img
            src={bg.url}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full"
            style={{
              objectFit: "cover",
              objectPosition: `${bg.focal_x ?? 50}% ${bg.focal_y ?? 50}%`,
              zIndex: 0,
            }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: dark
                ? `rgba(10, 17, 28, ${bg.overlay_opacity ?? 0.62})`
                : `rgba(251, 250, 247, ${bg.overlay_opacity ?? 0.88})`,
              zIndex: 0,
            }}
          />
        </>
      )}
      {gradStyle.backgroundImage && (
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ ...gradStyle, zIndex: 1 }} />
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
}


/** ────────────────────────────────────────────────────────────────
 * 1. HERO (page masthead)
 * ──────────────────────────────────────────────────────────────── */
export function AboutHeroB({ about }) {
  const { lang } = useLang();
  const tsEyebrow = getTextStyles(about, "hero", "eyebrow");
  const tsTitle = getTextStyles(about, "hero", "title");
  const tsSub = getTextStyles(about, "hero", "subtitle");
  const alignEyebrow = getTextAlign(about, "hero", "eyebrow");
  const alignTitle = getTextAlign(about, "hero", "title");
  const alignSub = getTextAlign(about, "hero", "subtitle");
  const s = about?.section_styles?.hero || {};
  const bg = s.bg;
  const hasBg = bg && bg.enabled !== false && bg.url;
  const bgColor = s.bg_color || "var(--tb-navy-900)";
  const gradStyle = getGradientOverlay(about, "hero");
  return (
    <section
      id="about-hero"
      data-testid="about-section-hero"
      className="relative isolate overflow-hidden pt-[140px] md:pt-[160px] pb-20 md:pb-24 min-h-[60vh]"
      style={{ backgroundColor: bgColor, color: "var(--tb-paper-base)" }}
    >
      {hasBg && (
        <>
          <img
            src={bg.url}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full tb-ken-burns"
            style={{
              objectFit: "cover",
              objectPosition: `${bg.focal_x ?? 50}% ${bg.focal_y ?? 50}%`,
              zIndex: 0,
            }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <div aria-hidden className="absolute inset-0"
            style={{ background: `rgba(10, 17, 28, ${bg.overlay_opacity ?? 0.62})`, zIndex: 0 }} />
        </>
      )}
      {gradStyle.backgroundImage && (
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ ...gradStyle, zIndex: 1 }} />
      )}
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14 flex flex-col justify-end h-full min-h-[40vh]">
        <Reveal variant="up">
          <div className="flex items-center gap-3" style={{ justifyContent: alignEyebrow === "center" ? "center" : alignEyebrow === "left" ? "flex-start" : undefined }}>
            <span style={{ height: 1, width: 26, background: "var(--tb-gold)" }} />
            <span className="tb-overline"
              style={{
                color: tsEyebrow.color || "var(--tb-gold)",
                fontWeight: tsEyebrow.fontWeight,
                fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
              }}>
              {about?.[`hero_eyebrow_${lang}`]}
            </span>
          </div>
        </Reveal>
        <Reveal variant="up" delay={1}>
          <h1
            className="tb-display mt-5 max-w-[26ch]"
            style={{
              color: tsTitle.color || "var(--tb-paper-base)",
              fontSize: `calc(clamp(1.85rem, 3.4vw, 2.85rem) * ${tsTitle.sizeMul})`,
              lineHeight: 1.2,
              fontWeight: tsTitle.fontWeight,
              textAlign: alignTitle || undefined,
            }}
          >
            {about?.[`hero_title_${lang}`]}
          </h1>
        </Reveal>
        {about?.[`hero_subtitle_${lang}`] && (
          <Reveal variant="up" delay={2}>
            <p className="mt-6 max-w-[58ch]"
              style={{
                color: tsSub.color || "rgba(251,250,247,0.82)",
                fontSize: tsSub.sizeMul !== 1 ? `calc(1.0625rem * ${tsSub.sizeMul})` : "1.0625rem",
                lineHeight: 1.85,
                fontWeight: tsSub.fontWeight,
                textAlign: alignSub || undefined,
              }}>
              {about[`hero_subtitle_${lang}`]}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}


/** ────────────────────────────────────────────────────────────────
 * 2. INTRO (long-form copy)
 * ──────────────────────────────────────────────────────────────── */
export function AboutIntroB({ about }) {
  const { lang } = useLang();
  const tsEyebrow = getTextStyles(about, "intro", "eyebrow");
  const tsTitle = getTextStyles(about, "intro", "title");
  const tsBody = getTextStyles(about, "intro", "body");
  const tsExt = getTextStyles(about, "intro", "extended");
  const alignTitle = getTextAlign(about, "intro", "title");
  const alignBody = getTextAlign(about, "intro", "body");
  const alignExt = getTextAlign(about, "intro", "extended");
  return (
    <SectionShell id="intro" sectionKey="intro" about={about}>
      <div className="mx-auto max-w-[920px] px-6 md:px-10 lg:px-12">
        <Reveal variant="up">
          <div className="flex items-center gap-3">
            <span style={{ height: 1, width: 24, background: "var(--tb-gold)" }} />
            <span className="tb-overline"
              style={{
                color: tsEyebrow.color || "var(--tb-gold-deep)",
                fontWeight: tsEyebrow.fontWeight,
                fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
              }}>
              {about?.[`intro_eyebrow_${lang}`]}
            </span>
          </div>
        </Reveal>
        <Reveal variant="up" delay={1}>
          <h2 className="tb-display mt-6"
            style={{
              color: tsTitle.color || "var(--tb-navy-900)",
              fontSize: `calc(clamp(1.85rem, 3.2vw, 2.6rem) * ${tsTitle.sizeMul})`,
              lineHeight: 1.25,
              fontWeight: tsTitle.fontWeight ?? 500,
              maxWidth: "22ch",
              textAlign: alignTitle || undefined,
            }}>
            {about?.[`intro_title_${lang}`]}
          </h2>
        </Reveal>
        <Reveal variant="up" delay={2}>
          <p className="mt-10"
            style={{
              fontFamily: '"Thmanyah Serif Text", serif',
              fontSize: tsBody.sizeMul !== 1 ? `calc(1.0625rem * ${tsBody.sizeMul})` : "1.0625rem",
              lineHeight: 1.95,
              color: tsBody.color || "var(--tb-text)",
              fontWeight: tsBody.fontWeight,
              textAlign: alignBody || undefined,
            }}>
            {about?.[`intro_body_${lang}`]}
          </p>
        </Reveal>
        {about?.[`intro_body_extended_${lang}`] && (
          <Reveal variant="up" delay={3}>
            <p className="mt-6"
              style={{
                fontSize: tsExt.sizeMul !== 1 ? `calc(1rem * ${tsExt.sizeMul})` : "1rem",
                lineHeight: 1.95,
                color: tsExt.color || "var(--tb-text-muted)",
                fontWeight: tsExt.fontWeight,
                textAlign: alignExt || undefined,
              }}>
              {about[`intro_body_extended_${lang}`]}
            </p>
          </Reveal>
        )}
      </div>
    </SectionShell>
  );
}


/** ────────────────────────────────────────────────────────────────
 * 3. MISSION & VISION — "Numbered Manifesto" layout
 *
 * Two vertical chapters stacked. Each chapter shows a HUGE faded
 * chapter numeral as a backdrop, an eyebrow, headline title, body,
 * and an elegant gold-square bullet list. A thin gold rule with a
 * small diamond medallion sits between them.
 * ──────────────────────────────────────────────────────────────── */
export function AboutMissionVisionB({ about }) {
  const { lang } = useLang();
  const Chapter = ({ idx, eyebrowKey, titleKey, bodyKey, pointsKey, fieldPrefix, lastChapter }) => {
    const tsEyebrow = getTextStyles(about, "mission_vision", `${fieldPrefix}_eyebrow`);
    const tsTitle   = getTextStyles(about, "mission_vision", `${fieldPrefix}_title`);
    const tsBody    = getTextStyles(about, "mission_vision", `${fieldPrefix}_body`);
    const tsPoints  = getTextStyles(about, "mission_vision", `${fieldPrefix}_points`);
    const alignEyebrow = getTextAlign(about, "mission_vision", `${fieldPrefix}_eyebrow`);
    const alignTitle = getTextAlign(about, "mission_vision", `${fieldPrefix}_title`);
    const alignBody = getTextAlign(about, "mission_vision", `${fieldPrefix}_body`);
    const alignPoints = getTextAlign(about, "mission_vision", `${fieldPrefix}_points`);
    const points = (about?.[`${pointsKey}_${lang}`] || []);
    return (
      <article
        className="relative mx-auto max-w-[920px] px-6 md:px-10 lg:px-12 py-16 md:py-20"
        data-testid={`about-${fieldPrefix}`}
      >
        {/* Huge faded chapter numeral as decorative backdrop */}
        <span
          aria-hidden
          className="pointer-events-none select-none absolute"
          style={{
            fontFamily: '"Thmanyah Serif Display", serif',
            fontSize: "clamp(14rem, 28vw, 26rem)",
            fontWeight: 300,
            color: "var(--tb-gold)",
            opacity: 0.07,
            lineHeight: 0.85,
            top: "-2rem",
            insetInlineEnd: "-1rem",
            letterSpacing: "-0.02em",
          }}
        >
          {idx}
        </span>

        <div className="relative">
          <Reveal variant="up">
            <div className="flex items-center gap-3"
              style={{ justifyContent: alignEyebrow === "center" ? "center" : alignEyebrow === "left" ? "flex-start" : undefined }}>
              <span aria-hidden style={{
                fontSize: 13, letterSpacing: "0.22em", color: "var(--tb-gold-deep)",
                fontWeight: 600, fontFeatureSettings: '"tnum" 1',
              }}>{idx}</span>
              <span aria-hidden style={{ height: 1, width: 30, background: "var(--tb-gold)" }} />
              <span className="tb-overline"
                style={{
                  color: tsEyebrow.color || "var(--tb-gold-deep)",
                  fontWeight: tsEyebrow.fontWeight,
                  fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
                }}>{about?.[`${eyebrowKey}_${lang}`]}</span>
            </div>
          </Reveal>
          <Reveal variant="up" delay={1}>
            <h2 className="tb-display mt-6"
              style={{
                color: tsTitle.color || "var(--tb-navy-900)",
                fontSize: `calc(clamp(2.4rem, 5vw, 4rem) * ${tsTitle.sizeMul})`,
                lineHeight: 1.05,
                fontWeight: tsTitle.fontWeight ?? 400,
                textAlign: alignTitle || undefined,
                letterSpacing: "-0.01em",
              }}>
              {about?.[`${titleKey}_${lang}`]}
            </h2>
          </Reveal>
          <Reveal variant="up" delay={2}>
            <p className="mt-8 max-w-[64ch]"
              style={{
                fontFamily: '"Thmanyah Serif Text", serif',
                fontSize: tsBody.sizeMul !== 1 ? `calc(1.0625rem * ${tsBody.sizeMul})` : "1.0625rem",
                lineHeight: 1.95,
                color: tsBody.color || "var(--tb-text)",
                fontWeight: tsBody.fontWeight,
                textAlign: alignBody || undefined,
              }}>
              {about?.[`${bodyKey}_${lang}`]}
            </p>
          </Reveal>
          {points.length > 0 && (
            <Reveal variant="up" delay={3}>
              <ul className="mt-10 space-y-4 max-w-[60ch]"
                style={{ borderTop: "1px solid var(--tb-hairline)", paddingTop: "1.75rem", textAlign: alignPoints || undefined }}>
                {points.map((p, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span aria-hidden style={{
                      marginTop: 11, flexShrink: 0,
                      width: 8, height: 8, background: "var(--tb-gold)",
                      transform: "rotate(45deg)",
                    }} />
                    <span style={{
                      fontSize: tsPoints.sizeMul !== 1 ? `calc(0.9375rem * ${tsPoints.sizeMul})` : "0.9375rem",
                      lineHeight: 1.85,
                      color: tsPoints.color || "var(--tb-text)",
                      fontWeight: tsPoints.fontWeight,
                    }}>{p}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>

        {/* Divider with medallion between chapters */}
        {!lastChapter && (
          <div className="mt-16 md:mt-20 flex items-center justify-center gap-4" aria-hidden>
            <span style={{ height: 1, width: 80, background: "var(--tb-hairline)" }} />
            <span style={{
              width: 10, height: 10, background: "var(--tb-gold)",
              transform: "rotate(45deg)",
            }} />
            <span style={{ height: 1, width: 80, background: "var(--tb-hairline)" }} />
          </div>
        )}
      </article>
    );
  };
  return (
    <SectionShell id="mission-vision" sectionKey="mission_vision" about={about} paddingY="py-12 md:py-16">
      <Chapter
        idx={lang === "ar" ? "٠١" : "01"}
        eyebrowKey="mission_eyebrow" titleKey="mission_title"
        bodyKey="mission_body" pointsKey="mission_points"
        fieldPrefix="mission"
      />
      <Chapter
        idx={lang === "ar" ? "٠٢" : "02"}
        eyebrowKey="vision_eyebrow" titleKey="vision_title"
        bodyKey="vision_body" pointsKey="vision_points"
        fieldPrefix="vision"
        lastChapter
      />
    </SectionShell>
  );
}


/** ────────────────────────────────────────────────────────────────
 * 4. OBJECTIVES (numbered grid)
 * ──────────────────────────────────────────────────────────────── */
export function AboutObjectivesB({ about }) {
  const { lang } = useLang();
  const tsEyebrow = getTextStyles(about, "objectives", "eyebrow");
  const tsTitle = getTextStyles(about, "objectives", "title");
  const tsItemTitle = getTextStyles(about, "objectives", "item_title");
  const tsItemDesc = getTextStyles(about, "objectives", "item_desc");
  const alignTitle = getTextAlign(about, "objectives", "title");
  const items = (about?.objectives || []).map((o) => ({
    id: o.id,
    title: lang === "ar" ? o.title_ar : o.title_en,
    desc:  lang === "ar" ? o.description_ar : o.description_en,
  }));
  if (!items.length) return null;
  return (
    <SectionShell id="objectives" sectionKey="objectives" about={about}>
      <div className="mx-auto max-w-[1180px] px-6 md:px-10 lg:px-12">
        <div className="max-w-[680px]">
          <Reveal variant="up">
            <div className="flex items-center gap-3">
              <span style={{ height: 1, width: 24, background: "var(--tb-gold)" }} />
              <span className="tb-overline"
                style={{
                  color: tsEyebrow.color,
                  fontWeight: tsEyebrow.fontWeight,
                  fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
                }}>{about?.[`objectives_eyebrow_${lang}`]}</span>
            </div>
          </Reveal>
          <Reveal variant="up" delay={1}>
            <h2 className="tb-display mt-5"
              style={{
                color: tsTitle.color,
                fontSize: `calc(clamp(1.6rem, 2.4vw, 2.1rem) * ${tsTitle.sizeMul})`,
                lineHeight: 1.32, fontWeight: tsTitle.fontWeight ?? 500,
                maxWidth: "32ch", textAlign: alignTitle || undefined,
              }}>
              {about?.[`objectives_title_${lang}`]}
            </h2>
          </Reveal>
        </div>
        <ol className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-7" data-testid="about-objectives-grid">
          {items.map((o, i) => (
            <Reveal key={o.id} as="li" variant="up" delay={Math.min(5, i + 1)}
              className="tb-card tb-card-hover flex flex-col gap-3"
              style={{ padding: "1.85rem 2.1rem 2.1rem", listStyle: "none" }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 13, color: "var(--tb-gold)", letterSpacing: "0.22em", fontWeight: 600 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ height: 1, width: 22, background: "var(--tb-gold)" }} />
              </div>
              <h3 className="tb-display"
                style={{
                  fontSize: tsItemTitle.sizeMul !== 1 ? `calc(1.2rem * ${tsItemTitle.sizeMul})` : "1.2rem",
                  lineHeight: 1.4, fontWeight: tsItemTitle.fontWeight ?? 500,
                  color: tsItemTitle.color,
                }}>{o.title}</h3>
              <p style={{
                fontSize: tsItemDesc.sizeMul !== 1 ? `calc(0.95rem * ${tsItemDesc.sizeMul})` : "0.95rem",
                lineHeight: 1.85, color: tsItemDesc.color || "var(--tb-text)",
                fontWeight: tsItemDesc.fontWeight,
              }}>{o.desc}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </SectionShell>
  );
}


/** ────────────────────────────────────────────────────────────────
 * 5. BOARD OF DIRECTORS
 * Editorial portrait cards — square photo, name, role, short bio.
 * ──────────────────────────────────────────────────────────────── */
export function BoardOfDirectorsB({ about }) {
  const { lang } = useLang();
  const tsEyebrow = getTextStyles(about, "board", "eyebrow");
  const tsTitle = getTextStyles(about, "board", "title");
  const tsBlurb = getTextStyles(about, "board", "blurb");
  const tsName = getTextStyles(about, "board", "name");
  const tsRole = getTextStyles(about, "board", "role");
  const tsBio = getTextStyles(about, "board", "bio");
  const alignTitle = getTextAlign(about, "board", "title");
  const alignBlurb = getTextAlign(about, "board", "blurb");
  const members = (about?.board_members || []).filter((m) => m && (m.name_ar || m.name_en));
  if (!members.length) return null;
  return (
    <SectionShell id="board" sectionKey="board" about={about}>
      <div className="mx-auto max-w-[1240px] px-6 md:px-10 lg:px-12">
        <div className="mx-auto max-w-[760px] text-center">
          <Reveal variant="up">
            <div className="inline-flex items-center gap-3 justify-center">
              <span style={{ height: 1, width: 24, background: "var(--tb-gold)" }} />
              <span className="tb-overline"
                style={{
                  color: tsEyebrow.color || "var(--tb-gold-deep)",
                  fontWeight: tsEyebrow.fontWeight,
                  fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
                }}>{about?.[`board_eyebrow_${lang}`]}</span>
              <span style={{ height: 1, width: 24, background: "var(--tb-gold)" }} />
            </div>
          </Reveal>
          <Reveal variant="up" delay={1}>
            <h2 className="tb-display mt-5 mx-auto"
              style={{
                color: tsTitle.color,
                fontSize: `calc(clamp(1.85rem, 3vw, 2.6rem) * ${tsTitle.sizeMul})`,
                lineHeight: 1.25, fontWeight: tsTitle.fontWeight ?? 500,
                maxWidth: "24ch", textAlign: alignTitle || "center",
              }}>{about?.[`board_title_${lang}`]}</h2>
          </Reveal>
          {about?.[`board_blurb_${lang}`] && (
            <Reveal variant="up" delay={2}>
              <p className="mt-6 mx-auto"
                style={{
                  fontFamily: '"Thmanyah Serif Text", serif',
                  fontSize: tsBlurb.sizeMul !== 1 ? `calc(1rem * ${tsBlurb.sizeMul})` : "1rem",
                  lineHeight: 1.9, color: tsBlurb.color || "var(--tb-text-muted)",
                  fontWeight: tsBlurb.fontWeight, maxWidth: "58ch",
                  textAlign: alignBlurb || "center",
                }}>{about[`board_blurb_${lang}`]}</p>
            </Reveal>
          )}
        </div>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 md:gap-8">
          {members.map((m, i) => {
            const name = lang === "ar" ? (m.name_ar || m.name_en) : (m.name_en || m.name_ar);
            const role = lang === "ar" ? (m.role_ar || m.role_en) : (m.role_en || m.role_ar);
            const bio  = lang === "ar" ? (m.bio_ar  || m.bio_en)  : (m.bio_en  || m.bio_ar);
            return (
              <Reveal key={m.id || i} variant="up" delay={Math.min(5, i + 1)}
                className="tb-card-hover" style={{ transitionDuration: "0.55s" }}>
                <article className="flex flex-col" data-testid={`board-member-${i}`}>
                  <div
                    className="relative w-full overflow-hidden"
                    style={{ aspectRatio: "4/5", background: "var(--tb-paper-deep)" }}
                  >
                    {m.image_url ? (
                      <img src={m.image_url} alt={name || ""} loading="lazy"
                        className="absolute inset-0 w-full h-full"
                        style={{ objectFit: "cover", objectPosition: "center 22%" }} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, var(--tb-paper-deep), var(--tb-paper-base))" }}>
                        <span aria-hidden style={{
                          fontFamily: '"Thmanyah Serif Display", serif',
                          fontSize: "3.5rem", color: "var(--tb-gold)", opacity: 0.45,
                          letterSpacing: "0.04em",
                        }}>{(name || "").charAt(0) || "·"}</span>
                      </div>
                    )}
                    <div aria-hidden style={{
                      position: "absolute", insetInlineStart: 0, bottom: 0,
                      width: 36, height: 3, background: "var(--tb-gold)",
                    }} />
                  </div>
                  <div className="pt-5">
                    <h3 className="tb-display"
                      style={{
                        fontSize: tsName.sizeMul !== 1 ? `calc(1.1rem * ${tsName.sizeMul})` : "1.1rem",
                        lineHeight: 1.35, fontWeight: tsName.fontWeight ?? 500,
                        color: tsName.color || "var(--tb-navy-900)",
                      }}>{name}</h3>
                    {role && (
                      <div className="mt-1.5 tb-overline"
                        style={{
                          color: tsRole.color || "var(--tb-gold-deep)",
                          fontWeight: tsRole.fontWeight,
                          fontSize: tsRole.sizeMul !== 1 ? `calc(0.72rem * ${tsRole.sizeMul})` : "0.72rem",
                        }}>{role}</div>
                    )}
                    {bio && (
                      <p className="mt-3"
                        style={{
                          fontSize: tsBio.sizeMul !== 1 ? `calc(0.9rem * ${tsBio.sizeMul})` : "0.9rem",
                          lineHeight: 1.8, color: tsBio.color || "var(--tb-text-muted)",
                          fontWeight: tsBio.fontWeight,
                        }}>{bio}</p>
                    )}
                    {m.linkedin && (
                      <a href={m.linkedin} target="_blank" rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-[12px] transition-colors"
                        style={{ color: "var(--tb-gold-deep)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--tb-navy-900)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--tb-gold-deep)"; }}>
                        <Linkedin size={13} strokeWidth={1.7} />
                        <span>LinkedIn</span>
                      </a>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}


/** ────────────────────────────────────────────────────────────────
 * 6. SUCCESS PARTNERS — logo wall
 * ──────────────────────────────────────────────────────────────── */
export function SuccessPartnersB({ about }) {
  const { lang } = useLang();
  const tsEyebrow = getTextStyles(about, "partners", "eyebrow");
  const tsTitle = getTextStyles(about, "partners", "title");
  const tsBlurb = getTextStyles(about, "partners", "blurb");
  const alignTitle = getTextAlign(about, "partners", "title");
  const alignBlurb = getTextAlign(about, "partners", "blurb");
  const partners = (about?.partners || []).filter((p) => p && (p.logo_url || p.name_ar || p.name_en));
  if (!partners.length) return null;
  return (
    <SectionShell id="partners" sectionKey="partners" about={about}>
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-12">
        <div className="mx-auto max-w-[720px] text-center">
          <Reveal variant="up">
            <div className="inline-flex items-center gap-3 justify-center">
              <span style={{ height: 1, width: 24, background: "var(--tb-gold)" }} />
              <span className="tb-overline"
                style={{
                  color: tsEyebrow.color || "var(--tb-gold-deep)",
                  fontWeight: tsEyebrow.fontWeight,
                  fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
                }}>{about?.[`partners_eyebrow_${lang}`]}</span>
              <span style={{ height: 1, width: 24, background: "var(--tb-gold)" }} />
            </div>
          </Reveal>
          <Reveal variant="up" delay={1}>
            <h2 className="tb-display mt-5"
              style={{
                color: tsTitle.color,
                fontSize: `calc(clamp(1.6rem, 2.5vw, 2.2rem) * ${tsTitle.sizeMul})`,
                lineHeight: 1.32, fontWeight: tsTitle.fontWeight ?? 500,
                maxWidth: "26ch", marginInline: "auto",
                textAlign: alignTitle || "center",
              }}>{about?.[`partners_title_${lang}`]}</h2>
          </Reveal>
          {about?.[`partners_blurb_${lang}`] && (
            <Reveal variant="up" delay={2}>
              <p className="mt-5 mx-auto"
                style={{
                  fontSize: tsBlurb.sizeMul !== 1 ? `calc(1rem * ${tsBlurb.sizeMul})` : "1rem",
                  lineHeight: 1.85, color: tsBlurb.color || "var(--tb-text-muted)",
                  fontWeight: tsBlurb.fontWeight, maxWidth: "56ch",
                  textAlign: alignBlurb || "center",
                }}>{about[`partners_blurb_${lang}`]}</p>
            </Reveal>
          )}
        </div>
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-10 items-center">
          {partners.map((p, i) => {
            const name = lang === "ar" ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar);
            const inner = p.logo_url ? (
              <img
                src={p.logo_url}
                alt={name || ""}
                loading="lazy"
                className="w-full h-12 md:h-14 object-contain"
                style={{
                  filter: "grayscale(100%)",
                  opacity: 0.7,
                  transition: "filter 300ms ease, opacity 300ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = "grayscale(0%)"; e.currentTarget.style.opacity = "1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = "grayscale(100%)"; e.currentTarget.style.opacity = "0.7"; }}
              />
            ) : (
              <div className="w-full h-12 md:h-14 flex items-center justify-center px-3"
                style={{ border: "1px dashed var(--tb-hairline)" }}>
                <span style={{
                  fontFamily: '"Thmanyah Serif Display", serif',
                  fontSize: "0.95rem", color: "var(--tb-text-muted)",
                  letterSpacing: "0.04em", textAlign: "center",
                }}>{name || "—"}</span>
              </div>
            );
            return (
              <Reveal key={p.id || i} variant="zoom" delay={Math.min(5, Math.floor(i / 2) + 1)}
                className="flex items-center justify-center"
                data-testid={`partner-logo-${i}`}>
                {p.link ? (
                  <a href={p.link} target="_blank" rel="noreferrer" className="block w-full" title={name || ""}>
                    {inner}
                  </a>
                ) : inner}
              </Reveal>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}


/** ────────────────────────────────────────────────────────────────
 * 6.5 STATS / KPI BAND — animated counters
 *
 * Each tile counts from 0 → its target value over ~1.6s when the
 * section first enters the viewport. Uses easeOutCubic so the
 * counter slows down at the end (more natural than linear).
 * Numerals are rendered with Arabic-Indic glyphs in RTL via
 * `Intl.NumberFormat("ar-SA")` when lang === "ar".
 * ──────────────────────────────────────────────────────────────── */
function AnimatedCounter({ target, durationMs = 1600, prefix = "", suffix = "", lang = "en" }) {
  const [ref, inView] = useInView({ threshold: 0.35, once: true });
  const [val, setVal] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const from = 0;
    const to = Number(target) || 0;
    const step = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else setVal(to);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [inView, target, durationMs]);

  const isInt = Number.isInteger(Number(target));
  const display = isInt ? Math.round(val) : (Math.round(val * 10) / 10);
  // Localised numerals for Arabic
  const formatted = lang === "ar"
    ? new Intl.NumberFormat("ar-SA", { maximumFractionDigits: isInt ? 0 : 1 }).format(display)
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: isInt ? 0 : 1 }).format(display);
  // Affixes render at ~55% of the number size so longer suffixes like "سنوات"/"yrs"
  // don't compete visually with the headline numeral and fit on a single line.
  const affixStyle = { fontSize: "0.55em", fontWeight: 500, opacity: 0.92, letterSpacing: 0 };
  return (
    <span
      ref={ref}
      data-testid="stat-counter"
      className="tabular-nums"
      style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "baseline", gap: "0.18em" }}
    >
      {prefix && <span style={affixStyle}>{prefix}</span>}
      <span>{formatted}</span>
      {suffix && <span style={affixStyle}>{suffix.trim()}</span>}
    </span>
  );
}

export function AboutStatsB({ about }) {
  const { lang } = useLang();
  const tsEyebrow = getTextStyles(about, "stats", "eyebrow");
  const tsTitle = getTextStyles(about, "stats", "title");
  const tsBlurb = getTextStyles(about, "stats", "blurb");
  const tsValue = getTextStyles(about, "stats", "value");
  const tsLabel = getTextStyles(about, "stats", "label");
  const alignTitle = getTextAlign(about, "stats", "title");
  const alignBlurb = getTextAlign(about, "stats", "blurb");
  const items = (about?.stats || []).filter((s) => s && (Number(s.value) || s.label_ar || s.label_en));
  if (!items.length) return null;
  const cols = items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return (
    <SectionShell id="stats" sectionKey="stats" about={about} dark paddingY="py-24 md:py-28">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-12">
        <div className="mx-auto max-w-[720px] text-center">
          <Reveal variant="up">
            <div className="inline-flex items-center gap-3 justify-center">
              <span style={{ height: 1, width: 24, background: "var(--tb-gold)" }} />
              <span className="tb-overline"
                style={{
                  color: tsEyebrow.color || "var(--tb-gold)",
                  fontWeight: tsEyebrow.fontWeight,
                  fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
                }}>{about?.[`stats_eyebrow_${lang}`]}</span>
              <span style={{ height: 1, width: 24, background: "var(--tb-gold)" }} />
            </div>
          </Reveal>
          <Reveal variant="up" delay={1}>
            <h2 className="tb-display mt-5"
              style={{
                color: tsTitle.color || "var(--tb-paper-base)",
                fontSize: `calc(clamp(1.7rem, 2.6vw, 2.3rem) * ${tsTitle.sizeMul})`,
                lineHeight: 1.3, fontWeight: tsTitle.fontWeight ?? 500,
                maxWidth: "26ch", marginInline: "auto",
                textAlign: alignTitle || "center",
              }}>{about?.[`stats_title_${lang}`]}</h2>
          </Reveal>
          {about?.[`stats_blurb_${lang}`] && (
            <Reveal variant="up" delay={2}>
              <p className="mt-5 mx-auto"
                style={{
                  fontSize: tsBlurb.sizeMul !== 1 ? `calc(1rem * ${tsBlurb.sizeMul})` : "1rem",
                  lineHeight: 1.85, color: tsBlurb.color || "rgba(251,250,247,0.72)",
                  fontWeight: tsBlurb.fontWeight, maxWidth: "60ch",
                  textAlign: alignBlurb || "center",
                }}>{about[`stats_blurb_${lang}`]}</p>
            </Reveal>
          )}
        </div>

        <div className={`mt-14 md:mt-16 grid grid-cols-2 sm:grid-cols-2 ${cols} gap-px`}
          style={{ background: "rgba(184, 155, 94, 0.18)" }} data-testid="stats-grid">
          {items.map((s, i) => (
            <Reveal key={s.id || i} variant="zoom" delay={Math.min(5, i + 1)}
              className="flex flex-col items-center text-center px-5 py-10 md:py-12"
              style={{ background: "var(--tb-navy-900, #0A111C)" }}
              data-testid={`stat-tile-${i}`}>
              <div className="tb-display"
                style={{
                  color: tsValue.color || "var(--tb-gold)",
                  fontSize: `calc(clamp(2.8rem, 5vw, 4rem) * ${tsValue.sizeMul})`,
                  lineHeight: 1, fontWeight: tsValue.fontWeight ?? 400,
                  letterSpacing: "-0.02em",
                  fontFamily: '"Thmanyah Serif Display", serif',
                }}>
                <AnimatedCounter
                  target={Number(s.value) || 0}
                  prefix={s.prefix || ""}
                  suffix={(lang === "ar" ? s.suffix_ar : s.suffix_en) || ""}
                  lang={lang}
                />
              </div>
              <div aria-hidden className="mt-4 mb-5" style={{ height: 1, width: 36, background: "var(--tb-gold)", opacity: 0.6 }} />
              <div
                style={{
                  fontFamily: '"Thmanyah Sans", sans-serif',
                  fontSize: tsLabel.sizeMul !== 1 ? `calc(0.875rem * ${tsLabel.sizeMul})` : "0.875rem",
                  lineHeight: 1.65,
                  letterSpacing: lang === "ar" ? "0.02em" : "0.08em",
                  color: tsLabel.color || "rgba(251,250,247,0.78)",
                  fontWeight: tsLabel.fontWeight ?? 500,
                  textTransform: lang === "ar" ? "none" : "uppercase",
                  maxWidth: "22ch",
                }}>
                {lang === "ar" ? s.label_ar : s.label_en}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}


/** ────────────────────────────────────────────────────────────────
 * 7. CONTACT CTA (dark band)
 * ──────────────────────────────────────────────────────────────── */
export function AboutContactCtaB({ about }) {
  const { lang } = useLang();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const tsEyebrow = getTextStyles(about, "contact_cta", "eyebrow");
  const tsTitle = getTextStyles(about, "contact_cta", "title");
  const tsBlurb = getTextStyles(about, "contact_cta", "blurb");
  const tsButton = getTextStyles(about, "contact_cta", "button");
  const alignTitle = getTextAlign(about, "contact_cta", "title");
  const alignBlurb = getTextAlign(about, "contact_cta", "blurb");
  const ctaLabel = about?.[`contact_cta_label_${lang}`] || (lang === "ar" ? "تواصل معنا" : "Get in touch");
  const ctaLink = about?.contact_cta_link || "/contact";
  return (
    <SectionShell id="contact-cta" sectionKey="contact_cta" about={about} dark paddingY="py-20 md:py-24">
      <div className="mx-auto max-w-[860px] px-6 md:px-10 text-center">
        <Reveal variant="up">
          <span className="tb-overline"
            style={{
              color: tsEyebrow.color || "var(--tb-gold)",
              fontWeight: tsEyebrow.fontWeight,
              fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
            }}>{about?.[`contact_eyebrow_${lang}`]}</span>
        </Reveal>
        <Reveal variant="up" delay={1}>
          <h2 className="tb-display mt-4"
            style={{
              color: tsTitle.color || "var(--tb-paper-base)",
              fontSize: `calc(clamp(1.5rem, 2.4vw, 2.05rem) * ${tsTitle.sizeMul})`,
              lineHeight: 1.35, fontWeight: tsTitle.fontWeight ?? 500,
              textAlign: alignTitle || "center",
            }}>{about?.[`contact_title_${lang}`]}</h2>
        </Reveal>
        {about?.[`contact_blurb_${lang}`] && (
          <Reveal variant="up" delay={2}>
            <p className="mt-5 mx-auto"
              style={{
                color: tsBlurb.color || "rgba(251,250,247,0.78)",
                fontSize: tsBlurb.sizeMul !== 1 ? `calc(1rem * ${tsBlurb.sizeMul})` : "1rem",
                lineHeight: 1.9, fontWeight: tsBlurb.fontWeight,
                maxWidth: "58ch", textAlign: alignBlurb || "center",
              }}>{about[`contact_blurb_${lang}`]}</p>
          </Reveal>
        )}
        <Reveal variant="up" delay={3}>
          <Link
            to={ctaLink}
            className="tb-btn-primary inline-flex items-center gap-2 mt-8 text-[14px]"
            style={{
              color: tsButton.color,
              fontWeight: tsButton.fontWeight,
              fontSize: tsButton.sizeMul !== 1 ? `calc(14px * ${tsButton.sizeMul})` : undefined,
            }}
            data-testid="about-contact-cta-link"
          >
            <span>{ctaLabel}</span>
            <Arrow size={16} strokeWidth={1.6} />
          </Link>
        </Reveal>
      </div>
    </SectionShell>
  );
}

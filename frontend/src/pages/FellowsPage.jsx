import { Linkedin, FileDown } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import HeroMediaLayer from "@/components/hero/HeroMediaLayer";
import { useLang } from "@/i18n/LanguageContext";
import { useFellowsPageContent } from "@/hooks/useSiteSettings";
import { getTextAlign, getTextStyles } from "@/lib/sectionTypo";
import Reveal from "@/components/theme-b/Reveal";

/** Convert admin textAlign value to CSS justifyContent for flex eyebrow rows */
function alignToFlex(align, isRtl) {
  if (align === "center") return "center";
  if (align === "left")  return isRtl ? "flex-end"   : "flex-start";
  if (align === "right") return isRtl ? "flex-start"  : "flex-end";
  return isRtl ? "flex-start" : "flex-start"; // default = natural start
}

export default function FellowsPage() {
  const { lang } = useLang();
  const isRtl = lang === "ar";
  const { data: page } = useFellowsPageContent();

  const ga = (section, field) => getTextAlign(page, section, field) || undefined;
  const gs = (section, field) => getTextStyles(page, section, field);

  const visible = Array.isArray(page?.visible_sections)
    ? page.visible_sections
    : ["hero", "intro", "fellows"];

  const t = (arKey, enKey, fallbackAr = "", fallbackEn = "") =>
    lang === "ar" ? (page?.[arKey] || fallbackAr) : (page?.[enKey] || fallbackEn);

  const sectionBg = (key) => page?.section_styles?.[key]?.bg_color || null;

  return (
    <PublicLayout>

      {/* ── HERO ── */}
      {visible.includes("hero") && (
        <section
          className="relative isolate overflow-hidden pt-[140px] md:pt-[160px] pb-20 md:pb-24 min-h-[62vh]"
          style={{ background: sectionBg("hero") || "var(--tb-navy-900, #0A111C)", color: "var(--tb-paper-base, #FBFAF7)" }}
          data-testid="fellows-hero"
        >
          <HeroMediaLayer pageKey="fellows" extendBehindHeader />
          <div className="relative z-10 mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14 flex flex-col justify-end h-full min-h-[40vh]">
            {t("hero_eyebrow_ar", "hero_eyebrow_en") && (
              <Reveal variant="up">
                <div className="flex items-center gap-3">
                  <span style={{ height: 1, width: 26, background: "var(--tb-gold, #B08C5A)" }} />
                  <span className="tb-overline" style={{ color: "var(--tb-gold, #B08C5A)" }}>
                    {t("hero_eyebrow_ar", "hero_eyebrow_en", "مجتمع البحث", "Research Community")}
                  </span>
                </div>
              </Reveal>
            )}
            <Reveal variant="up" delay={1}>
              <h1 className="tb-display mt-5 max-w-[26ch]"
                style={{ color: "var(--tb-paper-base, #FBFAF7)", fontSize: "clamp(2rem, 3.6vw, 3rem)", lineHeight: 1.2, textAlign: ga("hero","title") }}>
                {t("hero_title_ar", "hero_title_en", "زملاء لزام", "LIZAM Fellows")}
              </h1>
            </Reveal>
            {t("hero_subtitle_ar", "hero_subtitle_en") && (
              <Reveal variant="up" delay={2}>
                <p className="mt-6 max-w-[58ch]"
                  style={{ color: "rgba(251,250,247,0.82)", fontSize: "1.0625rem", lineHeight: 1.85, whiteSpace: "pre-line", textAlign: ga("hero","subtitle") }}>
                  {t("hero_subtitle_ar", "hero_subtitle_en")}
                </p>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* ── INTRO ── */}
      {visible.includes("intro") && (
        <section className="py-20 md:py-28"
          style={{ background: sectionBg("intro") || "var(--tb-ivory, #F7F5F0)" }}
          data-testid="fellows-intro">
          <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14">
            <div style={{ maxWidth: "760px", margin: ga("intro","title") === "center" ? "0 auto" : isRtl ? "0 0 0 auto" : "0 auto 0 0" }}>
              {t("intro_eyebrow_ar", "intro_eyebrow_en") && (
                <div className="flex items-center gap-3 mb-6"
                  style={{ justifyContent: alignToFlex(ga("intro","eyebrow"), isRtl) }}>
                  <span style={{ height: 1, width: 24, background: "var(--tb-gold, #B08C5A)" }} />
                  <span className="tb-overline" style={{ color: "var(--tb-gold, #B08C5A)" }}>
                    {t("intro_eyebrow_ar", "intro_eyebrow_en")}
                  </span>
                </div>
              )}
              <h2 className="tb-display"
                style={{ color: "var(--tb-navy-deep, #0A111C)", fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)", lineHeight: 1.2, textAlign: ga("intro","title") }}>
                {t("intro_title_ar", "intro_title_en", "برنامج زمالة لزام", "LIZAM Fellowship Program")}
              </h2>
              {t("intro_body_ar", "intro_body_en") && (
                <p className="mt-6"
                  style={{ fontSize: "clamp(15px, 1.4vw, 17px)", color: "rgba(28,37,51,0.72)", lineHeight: 1.9, whiteSpace: "pre-line", textAlign: ga("intro","body") }}>
                  {t("intro_body_ar", "intro_body_en")}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── FELLOWS ── */}
      {visible.includes("fellows") && (
        <section className="py-20 md:py-28"
          style={{ background: sectionBg("fellows") || "var(--tb-paper-base, #FBFAF7)" }}
          data-testid="fellows-section">
          <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14">
            {t("fellows_eyebrow_ar", "fellows_eyebrow_en") && (
              <div className="flex items-center gap-3 mb-6"
                style={{ justifyContent: alignToFlex(ga("fellows","eyebrow"), isRtl) }}>
                <span style={{ height: 1, width: 24, background: "var(--tb-gold, #B08C5A)" }} />
                <span className="tb-overline" style={{ color: "var(--tb-gold, #B08C5A)" }}>
                  {t("fellows_eyebrow_ar", "fellows_eyebrow_en")}
                </span>
              </div>
            )}
            <h2 className="tb-display mb-6"
              style={{ color: "var(--tb-navy-deep, #0A111C)", fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)", lineHeight: 1.2, textAlign: ga("fellows","title") }}>
              {t("fellows_title_ar", "fellows_title_en", "زملاء المركز", "Center Fellows")}
            </h2>
            {t("fellows_body_ar", "fellows_body_en") && (
              <p className="mb-12" style={{ fontSize: "clamp(15px, 1.4vw, 17px)", color: "rgba(28,37,51,0.72)", lineHeight: 1.9, maxWidth: "70ch", whiteSpace: "pre-line", textAlign: ga("fellows","body"), marginInline: ga("fellows","body") === "center" ? "auto" : undefined }}>
                {t("fellows_body_ar", "fellows_body_en")}
              </p>
            )}

            {/* Fellows grid */}
            {(page?.fellows_members || []).filter(m => m?.name_ar || m?.name_en).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {(page.fellows_members).filter(m => m?.name_ar || m?.name_en).map((m, i) => {
                  const name = lang === "ar" ? (m.name_ar || m.name_en) : (m.name_en || m.name_ar);
                  const role = lang === "ar" ? (m.role_ar || m.role_en) : (m.role_en || m.role_ar);
                  const bio  = lang === "ar" ? (m.bio_ar  || m.bio_en)  : (m.bio_en  || m.bio_ar);
                  return (
                    <article key={m.id || i}
                      className="group bg-white border border-rule flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_8px_32px_rgba(10,17,28,0.12)] hover:border-brass"
                      style={{ willChange: "transform" }}>
                      <div style={{ height: 3, background: "var(--tb-gold, #B89B5E)", opacity: 0.7 }} />

                      {/* Photo or monogram */}
                      {m.image_url ? (
                        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "1/1" }}>
                          <img src={m.image_url} alt={name || ""}
                            className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-center"
                          style={{ aspectRatio: "1/1", background: "linear-gradient(145deg, var(--tb-navy-900,#0A111C) 0%, #1C2D44 100%)" }}>
                          <span style={{ fontFamily: '"Thmanyah Serif Display", serif', fontSize: "clamp(3rem,5vw,4.5rem)", color: "var(--tb-gold,#B89B5E)", opacity: 0.35, lineHeight: 1 }}>
                            {(name || "").charAt(0)}
                          </span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 style={{ fontFamily: '"Thmanyah Serif Display", serif', fontSize: "1.05rem", lineHeight: 1.3, fontWeight: 500, color: "var(--tb-navy-900,#0A111C)" }}>
                          {name}
                        </h3>
                        {role && (
                          <div className="mt-1.5" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--tb-gold-deep,#8B6914)", textTransform: "uppercase" }}>
                            {role}
                          </div>
                        )}
                        {bio && (
                          <p className="mt-3 line-clamp-3 flex-1" style={{ fontSize: "0.875rem", lineHeight: 1.75, color: "var(--tb-text-muted,#667085)", whiteSpace: "pre-line" }}>
                            {bio}
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {m.linkedin && (
                            <a href={m.linkedin} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1.5 transition-colors duration-200"
                              style={{ fontSize: 12, color: "rgba(28,37,51,0.3)" }}
                              onMouseEnter={e => e.currentTarget.style.color = "var(--tb-gold,#B89B5E)"}
                              onMouseLeave={e => e.currentTarget.style.color = "rgba(28,37,51,0.3)"}>
                              <Linkedin size={13} strokeWidth={1.6} />
                              <span>LinkedIn</span>
                            </a>
                          )}
                          {m.cv_pdf_url && (
                            <a href={m.cv_pdf_url} target="_blank" rel="noreferrer" download
                              className="inline-flex items-center gap-1.5 transition-colors duration-200"
                              style={{ fontSize: 12, color: "rgba(28,37,51,0.3)" }}
                              onMouseEnter={e => e.currentTarget.style.color = "var(--tb-gold,#B89B5E)"}
                              onMouseLeave={e => e.currentTarget.style.color = "rgba(28,37,51,0.3)"}>
                              <FileDown size={13} strokeWidth={1.6} />
                              <span>{isRtl ? "تحميل السيرة الذاتية" : "Download CV"}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

    </PublicLayout>
  );
}

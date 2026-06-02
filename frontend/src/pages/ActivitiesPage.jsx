import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import HeroMediaLayer from "@/components/hero/HeroMediaLayer";
import { useLang } from "@/i18n/LanguageContext";
import { useActivitiesPageContent } from "@/hooks/useSiteSettings";
import { api } from "@/lib/api";
import { getTextAlign } from "@/lib/sectionTypo";
import Reveal from "@/components/theme-b/Reveal";

function alignToFlex(align, isRtl) {
  if (align === "center") return "center";
  if (align === "left")  return isRtl ? "flex-end"  : "flex-start";
  if (align === "right") return isRtl ? "flex-start" : "flex-end";
  return "flex-start";
}

function fmtDate(iso, lang) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-SA-u-ca-gregory" : "en-GB", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return iso; }
}

export default function ActivitiesPage() {
  const { lang } = useLang();
  const isRtl = lang === "ar";
  const { data: page } = useActivitiesPageContent();
  const [newsItems, setNewsItems] = useState([]);
  const ga = (section, field) => getTextAlign(page, section, field) || undefined;

  useEffect(() => {
    api.get("/public/news?limit=12")
      .then(({ data }) => setNewsItems(data.items || []))
      .catch(() => {});
  }, []);

  const visible = Array.isArray(page?.visible_sections)
    ? page.visible_sections
    : ["hero", "intro", "news"];

  const t = (arKey, enKey, fallbackAr, fallbackEn) =>
    lang === "ar"
      ? (page?.[arKey] || fallbackAr || "")
      : (page?.[enKey] || fallbackEn || "");

  const sectionBg = (key) => page?.section_styles?.[key]?.bg_color || null;

  return (
    <PublicLayout>

      {/* ── HERO ── */}
      {visible.includes("hero") && (
        <section
          className="relative isolate overflow-hidden pt-[140px] md:pt-[160px] pb-20 md:pb-24 min-h-[62vh]"
          style={{ background: sectionBg("hero") || "var(--tb-navy-900, #0A111C)", color: "var(--tb-paper-base, #FBFAF7)" }}
          data-testid="activities-hero"
        >
          <HeroMediaLayer pageKey="activities" extendBehindHeader />
          <div className="relative z-10 mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14 flex flex-col justify-end h-full min-h-[40vh]">
            {t("hero_eyebrow_ar", "hero_eyebrow_en") && (
              <Reveal variant="up">
                <div className="flex items-center gap-3">
                  <span style={{ height: 1, width: 26, background: "var(--tb-gold, #B08C5A)" }} />
                  <span className="tb-overline" style={{ color: "var(--tb-gold, #B08C5A)", textAlign: ga("hero","eyebrow") }}>
                    {t("hero_eyebrow_ar", "hero_eyebrow_en", "أخبار المركز", "Center News")}
                  </span>
                </div>
              </Reveal>
            )}
            <Reveal variant="up" delay={1}>
              <h1
                className="tb-display mt-5 max-w-[26ch]"
                style={{ color: "var(--tb-paper-base, #FBFAF7)", fontSize: "clamp(2rem, 3.6vw, 3rem)", lineHeight: 1.2, textAlign: ga("hero","title") }}
              >
                {t("hero_title_ar", "hero_title_en", "الأنشطة والفعاليات", "Activities & Events")}
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
        <section
          className="py-20 md:py-28"
          style={{ background: sectionBg("intro") || "var(--tb-ivory, #F7F5F0)" }}
          data-testid="activities-intro"
        >
          <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14">
            <div style={{ maxWidth: "760px", margin: ga("intro","title") === "center" ? "0 auto" : isRtl ? "0 0 0 auto" : "0 auto 0 0", textAlign: ga("intro","title") === "center" ? "center" : undefined }}>
              {t("intro_eyebrow_ar", "intro_eyebrow_en") && (
                <div className="flex items-center gap-3 mb-6" style={{ justifyContent: alignToFlex(ga("intro","eyebrow"), isRtl) }}>
                  <span style={{ height: 1, width: 24, background: "var(--tb-gold, #B08C5A)" }} />
                  <span className="tb-overline" style={{ color: "var(--tb-gold, #B08C5A)" }}>
                    {t("intro_eyebrow_ar", "intro_eyebrow_en")}
                  </span>
                </div>
              )}
              <h2 className="tb-display"
                style={{ color: "var(--tb-navy-deep, #0A111C)", fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)", lineHeight: 1.2, textAlign: ga("intro","title") }}>
                {t("intro_title_ar", "intro_title_en", "ما نقوم به", "What We Do")}
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

      {/* ── NEWS CARDS ── */}
      {visible.includes("news") && (
        <section
          className="py-20 md:py-28"
          style={{ background: sectionBg("news") || "var(--tb-paper-base, #FBFAF7)" }}
          data-testid="activities-news"
        >
          <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14">
            {t("news_eyebrow_ar", "news_eyebrow_en") && (
              <div className="flex items-center gap-3 mb-6">
                <span style={{ height: 1, width: 24, background: "var(--tb-gold, #B08C5A)" }} />
                <span className="tb-overline" style={{ color: "var(--tb-gold, #B08C5A)" }}>
                  {t("news_eyebrow_ar", "news_eyebrow_en")}
                </span>
              </div>
            )}
            <h2 className="tb-display mb-10"
              style={{ color: "var(--tb-navy-deep, #0A111C)", fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)", lineHeight: 1.2, textAlign: ga("news","title") }}>
              {t("news_title_ar", "news_title_en", "أحدث الفعاليات", "Recent Activities")}
            </h2>

            {newsItems.length === 0 ? (
              <p className="text-mute text-center py-16">
                {isRtl ? "لا توجد أخبار منشورة بعد." : "No news published yet."}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsItems.map(item => {
                  const title    = item[`title_${lang}`]    || item.title_ar    || item.title_en    || "";
                  const summary  = item[`summary_${lang}`]  || item.summary_ar  || item.summary_en  || "";
                  const category = item[`category_${lang}`] || item.category_ar || item.category_en || "";
                  const slug     = item[`slug_${lang}`]     || item.slug_ar     || item.slug_en     || item.id;
                  return (
                    <Link
                      key={item.id}
                      to={`/activities/${slug}`}
                      className="group block bg-white border border-rule hover:border-brass transition-colors duration-300 overflow-hidden"
                      data-testid={`news-card-${item.id}`}
                    >
                      {item.cover_image_url && (
                        <div style={{ aspectRatio: "16/9", overflow: "hidden" }}>
                          <img
                            src={item.cover_image_url} alt={title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        {category && (
                          <div className="text-[10.5px] uppercase tracking-[0.18em] text-brass mb-2">
                            {category}
                          </div>
                        )}
                        <h3
                          className="text-[15.5px] font-medium text-navy-deep leading-snug line-clamp-2 group-hover:text-brass transition-colors duration-300"
                          style={{ fontFamily: '"Thmanyah Serif Display", serif' }}
                        >
                          {title}
                        </h3>
                        {summary && (
                          <p className="mt-2 text-[13px] text-mute line-clamp-2 leading-relaxed">{summary}</p>
                        )}
                        {item.date && (
                          <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-mute">
                            <Calendar size={11} strokeWidth={1.4} />
                            {fmtDate(item.date, lang)}
                          </div>
                        )}
                      </div>
                    </Link>
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

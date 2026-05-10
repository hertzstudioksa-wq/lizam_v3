import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { useImageAssets } from "@/hooks/useImageAssets";

/** Theme B — About (refined): editorial layout paired with curated portrait image. */
export default function AboutB() {
  const { lang, pick } = useLang();
  const { data: home } = useHomeContent();
  const { bySlot } = useImageAssets();
  if (!home) return null;
  // Visibility — defaults to TRUE when the admin hasn't explicitly hidden the section.
  const vs = home?.visible_sections;
  if (Array.isArray(vs) && vs.length > 0 && !vs.includes("about")) return null;
  const body = pick(home, "about");
  const extended = pick(home, "about_extended");
  // Prefer admin-controlled image from /admin/home → About card.
  // Fallback to legacy /admin/images "about_image" slot for backward compat.
  const sectionBg = home?.section_styles?.about?.bg;
  const useSection = sectionBg?.enabled !== false && sectionBg?.url;
  const legacy = bySlot.about_image;
  const showImg = useSection || (legacy?.active && legacy?.url);
  const img = useSection ? sectionBg : legacy;
  const imgUrl = img?.url || "";
  const imgFx = img?.focal_x ?? 50;
  const imgFy = img?.focal_y ?? 50;
  const altText = img?.[`alt_${lang}`] || img?.alt_en || "";
  const titleScale = home?.section_styles?.about?.title_scale ?? 1;

  return (
    <section
      id="about"
      data-testid="section-about"
      data-theme-component="theme-b-about"
      style={{ background: "var(--tb-paper-base)" }}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Image column (LTR: left, RTL: right) */}
          {showImg && (
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div
                className="overflow-hidden relative"
                style={{
                  borderRadius: "var(--tb-radius-lg)",
                  aspectRatio: "4/5",
                  background: "#0A111C",
                  boxShadow: "var(--tb-shadow-rest)",
                }}
                role="img"
                aria-label={altText}
              >
                <img
                  src={imgUrl}
                  alt={altText}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full"
                  style={{ objectFit: "cover", objectPosition: `${imgFx}% ${imgFy}%` }}
                />
              </div>
            </div>
          )}

          {/* Text column */}
          <div className={`order-1 lg:order-2 ${showImg ? "lg:col-span-7" : "lg:col-span-12"}`}>
            <div className="tb-section-eyebrow">
              <span className="rule" />
              <span className="tb-overline">{home[`about_eyebrow_${lang}`] || (lang === "ar" ? "عن المركز" : "About")}</span>
            </div>
            <h2
              className="tb-display mt-8 max-w-[28ch]"
              style={{
                fontSize: `calc(clamp(2.1rem, 3.6vw, 3.1rem) * ${titleScale})`,
                lineHeight: 1.22,
                fontWeight: 500,
              }}
            >
              {lang === "ar"
                ? "مركز بحثي سعودي للدراسات القانونية والسياسات العامة."
                : "A Saudi research center for legal studies and public policy."}
            </h2>
            <div className="mt-10 space-y-7 max-w-[64ch]">
              <p className="tb-body-lg">{body}</p>
              {extended && <p className="tb-body-lg">{extended}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

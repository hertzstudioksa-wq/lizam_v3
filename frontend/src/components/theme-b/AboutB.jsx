import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { useImageAssets } from "@/hooks/useImageAssets";

/** Theme B — About (refined): editorial layout paired with curated portrait image. */
export default function AboutB() {
  const { lang, pick } = useLang();
  const { data: home } = useHomeContent();
  const { bySlot } = useImageAssets();
  if (!home) return null;
  const body = pick(home, "about");
  const extended = pick(home, "about_extended");
  const img = bySlot.about_image;
  const showImg = img?.active && img?.url;
  const altText = img?.[`alt_${lang}`] || img?.alt_en || "";

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
                className="overflow-hidden"
                style={{
                  borderRadius: "var(--tb-radius-lg)",
                  aspectRatio: "4/5",
                  background: `url(${img.url}) center/cover no-repeat`,
                  boxShadow: "var(--tb-shadow-rest)",
                }}
                role="img"
                aria-label={altText}
              />
            </div>
          )}

          {/* Text column */}
          <div className={`order-1 lg:order-2 ${showImg ? "lg:col-span-7" : "lg:col-span-12"}`}>
            <div className="tb-section-eyebrow">
              <span className="rule" />
              <span className="tb-overline">{lang === "ar" ? "عن المركز" : "About"}</span>
            </div>
            <h2
              className="tb-display mt-8 max-w-[28ch]"
              style={{ fontSize: "clamp(2.1rem, 3.6vw, 3.1rem)", lineHeight: 1.22, fontWeight: 500 }}
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

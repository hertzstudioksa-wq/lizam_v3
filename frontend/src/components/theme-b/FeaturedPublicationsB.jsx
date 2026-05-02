import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { usePublications } from "@/hooks/usePublications";
import { useImageAssets } from "@/hooks/useImageAssets";
import PublicationCardB from "@/components/theme-b/PublicationCardB";

/**
 * Theme B — Featured Publications (refined): two-band composition.
 * Top band: image-backed dark band with editorial intro.
 * Bottom band: paper-base cards.
 */
export default function FeaturedPublicationsB() {
  const { lang } = useLang();
  const { data } = usePublications({ limit: 6 });
  const { bySlot } = useImageAssets();
  const items = data?.items || [];
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const bandImg = bySlot.featured_band_background;
  const useBg = bandImg?.active && bandImg?.url;

  if (!items.length) return null;

  return (
    <section
      id="publications"
      data-testid="section-featured"
      data-theme-component="theme-b-featured"
    >
      {/* Image-backed intro band */}
      <div
        className="tb-image-section tb-image-section-dark relative"
        style={{
          background: useBg ? `url(${bandImg.url}) center/cover no-repeat` : "var(--tb-navy-900)",
          color: "var(--tb-paper-base)",
        }}
      >
        {useBg && <div className="tb-overlay" />}
        <div className="tb-content mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16 py-20 md:py-28">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="max-w-[640px]">
              <div className="tb-section-eyebrow">
                <span className="rule" />
                <span className="tb-overline" style={{ color: "var(--tb-gold-soft)" }}>
                  {lang === "ar" ? "الإصدارات" : "Publications"}
                </span>
              </div>
              <h2
                className="tb-display mt-7 max-w-[24ch]"
                style={{
                  fontSize: "clamp(2rem, 3.6vw, 2.85rem)",
                  lineHeight: 1.25,
                  fontWeight: 500,
                  color: "var(--tb-paper-base)",
                }}
              >
                {lang === "ar"
                  ? "قراءات بحثية موثوقة من المركز."
                  : "Trusted research, curated for impact."}
              </h2>
              <p
                className="mt-5 max-w-[58ch]"
                style={{
                  fontFamily: '"Thmanyah Serif Text", serif',
                  fontSize: 16,
                  lineHeight: 1.9,
                  color: "rgba(247, 244, 238, 0.78)",
                }}
              >
                {lang === "ar"
                  ? "مختارات من أحدث الدراسات والأوراق التحليلية التي يصدرها المركز للقطاعين العام والخاص."
                  : "A selection of the most recent studies and analytical papers from the Center, serving public and private institutions."}
              </p>
            </div>
            <Link to="/publications" className="tb-btn-on-dark group" data-testid="featured-view-all">
              <span>{lang === "ar" ? "استعراض الإصدارات" : "View all"}</span>
              <Arrow size={16} strokeWidth={1.7} />
            </Link>
          </div>
        </div>
      </div>

      {/* Cards band — paper-warm, with refined cards */}
      <div style={{ background: "var(--tb-paper-warm)" }}>
        <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.slice(0, 3).map((pub) => (
              <PublicationCardB key={pub.id} pub={pub} testid={`featured-pub-${pub.id}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

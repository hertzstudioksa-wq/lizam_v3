import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { usePublications } from "@/hooks/usePublications";
import PublicationCardB from "@/components/theme-b/PublicationCardB";

/** Theme B — Featured Publications: editorial 3-up grid. */
export default function FeaturedPublicationsB() {
  const { lang } = useLang();
  const { data } = usePublications({ limit: 6 });
  const items = data?.items || [];
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  if (!items.length) return null;

  return (
    <section
      id="publications"
      data-testid="section-featured"
      data-theme-component="theme-b-featured"
      style={{ background: "var(--tb-paper-deep)" }}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <div className="tb-section-eyebrow">
              <span className="rule" />
              <span className="tb-overline">{lang === "ar" ? "أحدث الإصدارات" : "Latest publications"}</span>
            </div>
            <h2
              className="tb-display mt-8 max-w-[24ch]"
              style={{ fontSize: "clamp(1.85rem, 3.2vw, 2.6rem)", lineHeight: 1.3, fontWeight: 500 }}
            >
              {lang === "ar" ? "قراءات موثوقة من المركز." : "Trusted readings from the Center."}
            </h2>
          </div>
          <Link
            to="/publications"
            className="tb-btn-ghost group"
            data-testid="featured-view-all"
          >
            <span style={{ fontWeight: 500 }}>{lang === "ar" ? "استعراض الإصدارات" : "View all publications"}</span>
            <Arrow size={16} strokeWidth={1.7} className="group-hover:translate-x-1 transition-transform duration-400" />
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.slice(0, 3).map((pub) => (
            <PublicationCardB key={pub.id} pub={pub} testid={`featured-pub-${pub.id}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

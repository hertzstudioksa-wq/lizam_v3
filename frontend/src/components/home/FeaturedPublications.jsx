import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { usePublications } from "@/hooks/usePublications";
import PublicationCard from "@/components/publications/PublicationCard";

export default function FeaturedPublications() {
  const { lang } = useLang();
  const { data } = usePublications({ limit: 6 });
  const items = data?.items || [];
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  if (!items.length) return null;

  return (
    <section id="publications" className="relative bg-paper" data-testid="section-featured">
      <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 py-24 md:py-32">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <div className="lz-eyebrow text-navy/70">
              {lang === "ar" ? "أحدث الإصدارات" : "Latest publications"}
            </div>
            <div className="mt-4 h-px w-12 bg-brass" />
            <h2 className="lz-h2 mt-8 max-w-[24ch]">
              {lang === "ar" ? "قراءات موثوقة من المركز." : "Trusted readings from the Center."}
            </h2>
          </div>
          <Link
            to="/publications"
            className="inline-flex items-center gap-3 text-[13.5px] text-navy hover:text-brass transition-colors duration-500 group"
            data-testid="featured-view-all"
          >
            <span className="lz-linkline">{lang === "ar" ? "استعراض الإصدارات" : "View all publications"}</span>
            <Arrow size={16} strokeWidth={1.7} />
          </Link>
        </div>

        <div className="mt-14 md:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-rule border border-rule">
          {items.slice(0, 3).map((pub) => (
            <PublicationCard key={pub.id} pub={pub} testid={`featured-pub-${pub.id}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

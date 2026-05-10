import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { usePublications } from "@/hooks/usePublications";
import PublicationCardB from "@/components/theme-b/PublicationCardB";

/**
 * Theme B — Featured Publications (Nadeem-inspired refinement).
 * Centered heading with thin gold underline.
 * 3 horizontal cards in a row on desktop. Centered "View all" outline button below.
 * Single warm-paper background, generous vertical rhythm.
 */
export default function FeaturedPublicationsB() {
  const { lang } = useLang();
  const { data: home } = useHomeContent();
  // Prefer admin-curated featured publications, then fill with latest until we
  // have up to 3 unique items. Ensures the home section reflects ALL recent
  // published items even if fewer than 3 are flagged "featured".
  const featuredQuery = usePublications({ featured: true, limit: 6 });
  const latestQuery = usePublications({ limit: 6 });
  const featuredItems = featuredQuery.data?.items || [];
  const latestItems = latestQuery.data?.items || [];
  const seen = new Set();
  const merged = [];
  for (const p of [...featuredItems, ...latestItems]) {
    if (!p?.id || seen.has(p.id)) continue;
    seen.add(p.id);
    merged.push(p);
    if (merged.length >= 3) break;
  }
  const items = merged;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  if (!items.length) return null;

  return (
    <section
      id="publications"
      data-testid="section-featured"
      data-theme-component="theme-b-featured"
      style={{ background: "var(--tb-paper-base)" }}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16 py-32 md:py-40">
        {/* Centered heading block — Nadeem rhythm */}
        <header className="text-center mx-auto max-w-[720px]">
          <div className="tb-overline" style={{ color: "var(--tb-gold-deep)", letterSpacing: "0.22em" }}>
            {home?.[`featured_eyebrow_${lang}`] || (lang === "ar" ? "المكتبة البحثية" : "Research Library")}
          </div>
          <h2
            className="tb-display mt-6 mx-auto"
            style={{
              fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
              lineHeight: 1.25,
              fontWeight: 500,
              color: "var(--tb-navy-900)",
              maxWidth: "22ch",
            }}
          >
            {lang === "ar" ? "أحدث الإصدارات" : "Latest Publications"}
          </h2>
          <div className="mt-7 mx-auto" style={{ height: 1, width: 56, background: "var(--tb-gold)" }} />
          <p
            className="mt-7 mx-auto"
            style={{
              fontFamily: '"Thmanyah Serif Text", serif',
              fontSize: 16,
              lineHeight: 1.95,
              color: "var(--tb-text-muted)",
              maxWidth: "58ch",
            }}
          >
            {lang === "ar"
              ? "مختارات من أحدث الدراسات والأوراق التحليلية التي يصدرها المركز للقطاعين العام والخاص."
              : "A selection of the most recent studies and analytical papers from the Center, serving public and private institutions."}
          </p>
        </header>

        {/* 3 horizontal cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 md:gap-8">
          {items.map((pub) => (
            <PublicationCardB key={pub.id} pub={pub} testid={`featured-pub-${pub.id}`} />
          ))}
        </div>

        {/* Centered "View all" — Nadeem-style outlined */}
        <div className="mt-20 text-center">
          <Link
            to="/publications"
            className="inline-flex items-center gap-3 px-10 py-4 transition-all duration-400"
            style={{
              border: "1px solid var(--tb-navy-900)",
              color: "var(--tb-navy-900)",
              fontFamily: '"Thmanyah Sans", sans-serif',
              fontSize: 14,
              letterSpacing: "0.16em",
              textTransform: lang === "ar" ? "none" : "uppercase",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--tb-navy-900)";
              e.currentTarget.style.color = "var(--tb-paper-base)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--tb-navy-900)";
            }}
            data-testid="featured-view-all"
          >
            <span>{lang === "ar" ? "استعراض كل الإصدارات" : "View all publications"}</span>
            <Arrow size={15} strokeWidth={1.6} />
          </Link>
        </div>
      </div>
    </section>
  );
}

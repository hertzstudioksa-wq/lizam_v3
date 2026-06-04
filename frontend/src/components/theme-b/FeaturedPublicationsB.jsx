import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { useImageAssets } from "@/hooks/useImageAssets";
import { usePublications } from "@/hooks/usePublications";
import PublicationCardB from "@/components/theme-b/PublicationCardB";
import { getTextStyles, getTextAlign, getGradientOverlay } from "@/lib/sectionTypo";

/**
 * Theme B — Featured Publications (Nadeem-inspired refinement).
 * Centered heading with thin gold underline.
 * 3 horizontal cards in a row on desktop. Centered "View all" outline button below.
 * Single warm-paper background, generous vertical rhythm.
 */
export default function FeaturedPublicationsB() {
  const { lang } = useLang();
  const { data: home } = useHomeContent();
  const { bySlot } = useImageAssets();
  // Prefer admin-controlled bg from /admin/home → Featured Publications card.
  const sec = home?.section_styles?.featured_publications?.bg;
  const useSec = sec?.enabled !== false && sec?.url;
  const legacy = bySlot.library_background;
  const bg = useSec ? sec : legacy;
  const hasBg = (useSec && sec.url) || (legacy && legacy.active && legacy.url);
  // Admin-controlled count + sort (saved in /admin/home → "Featured Publications" card).
  const cardCount = [3, 6, 9].includes(home?.featured_count) ? home.featured_count : 3;
  const sortMode = home?.featured_sort === "most_viewed" ? "most_viewed" : "latest";
  // Prefer admin-curated featured publications, then fill with latest until we
  // have up to `cardCount` unique items. Ensures the home section reflects ALL recent
  // published items even if fewer than `cardCount` are flagged "featured".
  const featuredQuery = usePublications({ featured: true, sort: sortMode, limit: cardCount * 2 });
  const latestQuery = usePublications({ sort: sortMode, limit: cardCount * 2 });
  const featuredItems = featuredQuery.data?.items || [];
  const latestItems = latestQuery.data?.items || [];
  const seen = new Set();
  const merged = [];
  for (const p of [...featuredItems, ...latestItems]) {
    if (!p?.id || seen.has(p.id)) continue;
    seen.add(p.id);
    merged.push(p);
    if (merged.length >= cardCount) break;
  }
  const items = merged;
  // Duplicate the items so the marquee track can loop seamlessly from 0 → -50%.
  // If only 1–2 unique items exist, repeat enough times to fill the viewport.
  const minMarqueeItems = 6;
  const repeats = items.length === 0 ? 0 : Math.max(2, Math.ceil(minMarqueeItems / items.length) * 2);
  const marqueeItems = Array.from({ length: repeats }, () => items).flat();
  // Slow the scroll a touch as we add more cards.
  const marqueeDuration = `${Math.max(28, items.length * 9)}s`;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const tsEyebrow = getTextStyles(home, "featured_publications", "eyebrow");
  const tsTitle = getTextStyles(home, "featured_publications", "title");
  const tsBlurb = getTextStyles(home, "featured_publications", "blurb");
  const alignEyebrow = getTextAlign(home, "featured_publications", "eyebrow");
  const alignTitle = getTextAlign(home, "featured_publications", "title");
  const alignBlurb = getTextAlign(home, "featured_publications", "blurb");
  const gradStyle = getGradientOverlay(home, "featured_publications");

  // Visibility — placed AFTER all hooks (hook rules). Defaults to TRUE.
  const vs = home?.visible_sections;
  if (Array.isArray(vs) && vs.length > 0 && !vs.includes("featured_publications")) return null;

  if (!items.length) return null;

  return (
    <section
      id="publications"
      data-testid="section-featured"
      data-theme-component="theme-b-featured"
      className="relative isolate overflow-hidden"
      style={{ backgroundColor: home?.section_styles?.featured_publications?.bg_color || "var(--tb-paper-base)" }}
    >
      {gradStyle.backgroundImage && (
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ ...gradStyle, zIndex: 1 }} />
      )}
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
            style={{ background: "rgba(251, 250, 247, 0.88)", zIndex: 0 }}
          />
        </>
      )}
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16 py-32 md:py-40">
        {/* Centered heading block — Nadeem rhythm */}
        <header className="text-center mx-auto max-w-[720px]">
          <div
            className="tb-overline"
            style={{
              color: tsEyebrow.color || "var(--tb-gold-deep)",
              letterSpacing: lang === "ar" ? "0.02em" : "0.22em",
              fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
              fontWeight: tsEyebrow.fontWeight,
              textAlign: alignEyebrow || undefined,
            }}
          >
            {home?.[`featured_eyebrow_${lang}`] || (lang === "ar" ? "المكتبة البحثية" : "Research Library")}
          </div>
          <h2
            className="tb-display mt-6 mx-auto"
            style={{
              fontSize: `calc(clamp(2.2rem, 4vw, 3.2rem) * ${tsTitle.sizeMul})`,
              lineHeight: 1.25,
              fontWeight: tsTitle.fontWeight ?? 500,
              color: tsTitle.color || "var(--tb-navy-900)",
              maxWidth: "22ch",
              textAlign: alignTitle || undefined,
            }}
            data-testid="featured-title"
          >
            {home?.[`featured_title_${lang}`] || (lang === "ar" ? "أحدث الإصدارات" : "Latest Publications")}
          </h2>
          <div className="mt-7 mx-auto" style={{ height: 1, width: 56, background: "var(--tb-gold)" }} />
          <p
            className="mt-7 mx-auto"
            style={{
              fontFamily: '"Thmanyah Serif Text", serif',
              fontSize: tsBlurb.sizeMul !== 1 ? `calc(16px * ${tsBlurb.sizeMul})` : 16,
              lineHeight: 1.95,
              color: tsBlurb.color || "var(--tb-text-muted)",
              fontWeight: tsBlurb.fontWeight,
              maxWidth: "58ch",
              textAlign: alignBlurb || "justify",
              textAlignLast: "start",
              whiteSpace: "pre-line",
            }}
            data-testid="featured-blurb"
          >
            {home?.[`featured_blurb_${lang}`] || (lang === "ar"
              ? "مختارات من أحدث الدراسات والأوراق التحليلية التي يصدرها المركز للقطاعين العام والخاص."
              : "A selection of the most recent studies and analytical papers from the Center, serving public and private institutions.")}
          </p>
        </header>

        {/* Auto-scrolling marquee — RTL visual flow (right → left), infinite loop.
            Track is forced dir="ltr" so the translateX math is consistent regardless
            of page direction. Edge fades come from the viewport's CSS mask. */}
        <div
          className="mt-20 tb-marquee-viewport"
          data-testid="featured-marquee"
          dir="ltr"
          aria-roledescription="carousel"
        >
          <div
            className="tb-marquee-track"
            style={{ "--tb-marquee-duration": marqueeDuration }}
          >
            {marqueeItems.map((pub, i) => (
              <div
                key={`${pub.id}-${i}`}
                className="tb-marquee-item tb-card-hover"
                aria-hidden={i >= items.length ? "true" : undefined}
              >
                <PublicationCardB
                  pub={pub}
                  testid={i < items.length ? `featured-pub-${pub.id}` : undefined}
                />
              </div>
            ))}
          </div>
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

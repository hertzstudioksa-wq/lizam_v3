import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { usePublications } from "@/hooks/usePublications";

const FALLBACK_COVER = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400";

export default function FeaturedPublicationsC() {
  const { lang } = useLang();
  const { data } = usePublications({ limit: 5, sort: "latest" });
  const items = data?.items || [];
  if (!items.length) return null;
  const lead = items[0];
  const rest = items.slice(1, 4);

  const slugFor = (p) => p.slug_ar || p.slug_en || p.id;
  const titleOf = (p) => (lang === "ar" ? p.title_ar : p.title_en) || p.title_ar || p.title_en;
  const summaryOf = (p) => (lang === "ar" ? p.summary_ar : p.summary_en) || "";

  return (
    <section
      className="py-24 md:py-32"
      style={{ background: "var(--tc-ivory)" }}
      data-testid="section-featured-publications"
      data-theme-component="theme-c-featured"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14">
        <div className="flex items-end justify-between gap-6 mb-14">
          <div>
            <div className="tc-overline">{lang === "ar" ? "المختارات" : "Editorial Selection"}</div>
            <h2
              className="mt-5 text-[36px] md:text-[44px] lg:text-[52px] leading-[1.15] font-semibold"
              style={{ color: "var(--tc-navy)", fontFamily: lang === "ar" ? 'var(--lz-font-ar, "Thmanyah Serif Display"), serif' : '"Source Serif 4", serif' }}
            >
              {lang === "ar" ? "أحدث الدراسات والأوراق" : "Latest studies & papers"}
            </h2>
          </div>
          <Link to="/publications" className="hidden md:inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.18em]" style={{ color: "var(--tc-navy)" }}>
            <span>{lang === "ar" ? "كل الإصدارات" : "View all"}</span>
            <ArrowRight size={14} className={lang === "ar" ? "rotate-180" : ""} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Lead — 60% width feature */}
          <article className="lg:col-span-7" data-testid={`featured-lead-${lead.id}`}>
            <Link to={`/publications/${slugFor(lead)}`} className="group block">
              <div className="tc-lead-image">
                <img
                  src={lead.cover_image_url || FALLBACK_COVER}
                  alt=""
                  loading="lazy"
                />
              </div>
              <div className="mt-7 flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-[0.18em] font-medium" style={{ color: "var(--tc-gold)" }}>
                  {lead.publication_type?.replace("_", " ") || (lang === "ar" ? "دراسة" : "Study")}
                </span>
                <span style={{ color: "var(--tc-text-muted)", fontSize: 12 }}>·</span>
                <span className="text-[12px] tabular-nums" style={{ color: "var(--tc-text-muted)" }}>
                  {(lead.published_at || lead.created_at || "").slice(0, 10)}
                </span>
              </div>
              <h3
                className="mt-5 text-[26px] md:text-[32px] lg:text-[36px] leading-[1.2] font-semibold transition-colors duration-200 group-hover:text-[var(--tc-gold)]"
                style={{ color: "var(--tc-navy)", fontFamily: lang === "ar" ? 'var(--lz-font-ar, "Thmanyah Serif Display"), serif' : '"Source Serif 4", serif' }}
              >
                {titleOf(lead)}
              </h3>
              {summaryOf(lead) && (
                <p className="mt-5 text-[15.5px] leading-[1.75] max-w-[60ch]" style={{ color: "var(--tc-text-muted)" }}>
                  {summaryOf(lead)}
                </p>
              )}
            </Link>
          </article>

          {/* Index — 40% column with hairlines */}
          <div className="lg:col-span-5" data-testid="featured-index">
            {rest.map((p, i) => (
              <Link
                key={p.id}
                to={`/publications/${slugFor(p)}`}
                className="tc-editorial-item block group"
                data-testid={`featured-item-${p.id}`}
                style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 24, paddingBlock: 24, alignItems: "baseline", borderBottom: "1px solid var(--tc-rule)" }}
              >
                <span className="tc-num" style={{ color: "var(--tc-gold)", fontFamily: '"Source Serif 4", serif', fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                  {String(i + 2).padStart(2, "0")}
                </span>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--tc-text-muted)" }}>
                    {p.publication_type?.replace("_", " ")}
                  </div>
                  <div
                    className="mt-2 text-[18px] md:text-[19px] leading-[1.35] font-semibold transition-colors duration-200 group-hover:text-[var(--tc-gold)]"
                    style={{ color: "var(--tc-navy)" }}
                  >
                    {titleOf(p)}
                  </div>
                </div>
                <span className="text-[11px] tabular-nums whitespace-nowrap" style={{ color: "var(--tc-text-muted)" }}>
                  {(p.published_at || p.created_at || "").slice(0, 10)}
                </span>
              </Link>
            ))}
            <div className="mt-8 md:hidden">
              <Link to="/publications" className="tc-btn-ghost-dark">
                <span>{lang === "ar" ? "كل الإصدارات" : "View all"}</span>
                <ArrowRight size={14} className={lang === "ar" ? "rotate-180" : ""} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

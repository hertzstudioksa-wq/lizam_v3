import { Link } from "react-router-dom";
import { Eye, Clock, Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

function fmtDate(iso, lang) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

const TYPE_LABELS = {
  ar: { study: "دراسة", policy_paper: "ورقة سياسات", research: "بحث", report: "تقرير", essay: "مقالة", opinion: "رأي" },
  en: { study: "Study", policy_paper: "Policy Paper", research: "Research", report: "Report", essay: "Essay", opinion: "Opinion" },
};

const ACCESS_BADGE = {
  ar: { public: "متاح", preview_login: "معاينة + تسجيل", registered: "للمسجلين", hidden: "مخفي" },
  en: { public: "Open", preview_login: "Preview", registered: "Members", hidden: "Hidden" },
};

/**
 * Theme B — Premium Editorial Publication Card.
 * Sharp edges, gold edge reveal on hover, refined metadata rail with gold separators.
 */
export default function PublicationCardB({ pub, compact = false, testid = "pub-card" }) {
  const { lang } = useLang();
  const title = pub[`title_${lang}`] || pub.title_en || pub.title_ar;
  const summary = pub[`summary_${lang}`] || pub.summary_en || pub.summary_ar;
  const slug = pub[`slug_${lang}`] || pub.slug_en || pub.slug_ar || pub.id;
  const type = TYPE_LABELS[lang][pub.publication_type] || pub.publication_type;
  const date = fmtDate(pub.published_at, lang);
  const access = ACCESS_BADGE[lang][pub.access_level] || "";
  const readTime = pub.reading_time_minutes || 0;
  const views = pub.view_count || 0;
  const gated = pub.access_level && pub.access_level !== "public";
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <article className="tb-card group" data-testid={testid} data-theme-component="theme-b-card">
      <Link to={`/publications/${slug}`} className="block h-full">
        {/* Eyebrow row */}
        <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.22em]">
          <div className="flex items-center" style={{ color: "var(--tb-text-muted)" }}>
            <span className="font-semibold" style={{ color: "var(--tb-gold)" }}>{type}</span>
            <span className="tb-meta-sep" />
            <span className="tabular-nums">{date}</span>
          </div>
          {access && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5"
              style={{
                color: gated ? "var(--tb-navy-900)" : "var(--tb-gold-deep)",
                background: "var(--tb-gold-faint)",
                borderRadius: "var(--tb-radius-pill)",
                fontSize: 10,
              }}
            >
              {gated && <Lock size={10} strokeWidth={2} />}
              <span style={{ letterSpacing: "0.1em" }}>{access}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={`mt-5 tb-display ${compact ? "text-[20px] md:text-[22px]" : "text-[22px] md:text-[26px]"}`}
          style={{ lineHeight: 1.35, fontWeight: 500 }}
        >
          {title}
        </h3>

        {/* Summary */}
        {summary && (
          <p
            className="mt-4 max-w-[60ch]"
            style={{
              fontFamily: '"Thmanyah Sans", sans-serif',
              fontSize: 14.5,
              lineHeight: 1.85,
              color: "var(--tb-text-muted)",
            }}
          >
            {summary.length > 180 ? summary.slice(0, 180) + "…" : summary}
          </p>
        )}

        {/* Tags */}
        {pub.tags && pub.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {pub.tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="text-[11.5px]" style={{ color: "var(--tb-text-muted)" }}>
                <span className="me-1" style={{ color: "var(--tb-gold)" }}>/</span>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="mt-7 pt-5 flex items-center justify-between gap-4 text-[12.5px]" style={{ borderTop: "1px solid var(--tb-hairline)", color: "var(--tb-text-muted)" }}>
          <div className="flex items-center">
            <span className="inline-flex items-center gap-1.5">
              <Eye size={12} strokeWidth={1.6} />
              <span className="tabular-nums">{views.toLocaleString(lang === "ar" ? "ar-SA" : "en")}</span>
            </span>
            <span className="tb-meta-sep" />
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} strokeWidth={1.6} />
              <span>{readTime} {lang === "ar" ? "دقيقة قراءة" : "min read"}</span>
            </span>
          </div>
          <span
            className="inline-flex items-center gap-2"
            style={{ color: "var(--tb-navy-900)", fontWeight: 500 }}
          >
            <span>{lang === "ar" ? "اقرأ" : "Read"}</span>
            <Arrow size={14} className="tb-card-arrow" />
          </span>
        </div>
      </Link>
    </article>
  );
}

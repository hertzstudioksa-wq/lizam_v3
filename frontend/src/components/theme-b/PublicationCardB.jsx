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
  ar: { public: "متاح", preview_login: "معاينة", registered: "للمسجلين", hidden: "مخفي" },
  en: { public: "Open", preview_login: "Preview", registered: "Members", hidden: "Hidden" },
};

/**
 * Theme B — Editorial Publication Card.
 * Typography-first design matching the cleanliness of FieldsOfWorkB cards:
 * gold edge reveal on hover, refined radius, paper background, hairline border.
 * No heavy cover-image area — focus is on type/date eyebrow, serif title,
 * summary, and a minimal meta footer with views + reading time + arrow.
 */
export default function PublicationCardB({ pub, testid = "pub-card" }) {
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
    <Link
      to={`/publications/${slug}`}
      className="block h-full"
      data-testid={testid}
      data-theme-component="theme-b-card"
    >
      <article
        className="tb-card flex flex-col h-full"
        style={{ minHeight: 320 }}
      >
        {/* Cover image (edge-to-edge, breaks out of card padding) */}
        {pub.cover_image_url && (
          <div
            className="relative overflow-hidden"
            style={{
              marginInline: "-1.75rem",
              marginTop: "-1.75rem",
              marginBottom: "1.5rem",
              aspectRatio: "16 / 10",
              background: "var(--tb-paper-deep)",
            }}
          >
            <img
              src={pub.cover_image_url}
              alt={title}
              loading="lazy"
              className="w-full h-full"
              style={{
                objectFit: "cover",
                objectPosition: "center",
                transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              data-testid={`${testid}-cover`}
            />
            {/* Subtle bottom fade for text breathing room */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-16"
              style={{
                background:
                  "linear-gradient(to top, rgba(255,255,255,0.55), rgba(255,255,255,0))",
                pointerEvents: "none",
              }}
            />
          </div>
        )}

        {/* Top row: type · date eyebrow + access badge */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="inline-flex items-center text-[11px] uppercase tracking-[0.22em]"
            style={{ color: "var(--tb-text-muted)" }}
          >
            <span style={{ color: "var(--tb-gold-deep)", fontWeight: 600 }}>{type}</span>
            <span className="tb-meta-sep" />
            <span className="tabular-nums">{date}</span>
          </div>

          {gated && access && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 shrink-0"
              style={{
                background: "var(--tb-gold-faint)",
                color: "var(--tb-gold-deep)",
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                borderRadius: "var(--tb-radius-pill)",
                fontWeight: 600,
                fontFamily: '"Thmanyah Sans", sans-serif',
              }}
            >
              <Lock size={10} strokeWidth={2} />
              <span>{access}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="mt-7"
          style={{
            fontFamily: '"Thmanyah Serif Display", serif',
            fontSize: "clamp(1.2rem, 1.55vw, 1.45rem)",
            lineHeight: 1.4,
            fontWeight: 500,
            color: "var(--tb-navy-900)",
          }}
        >
          {title}
        </h3>

        {/* Summary */}
        {summary && (
          <p
            className="mt-4"
            style={{
              fontFamily: '"Thmanyah Serif Text", serif',
              fontSize: 14.5,
              lineHeight: 1.9,
              color: "var(--tb-text-muted)",
            }}
          >
            {summary.length > 150 ? summary.slice(0, 150) + "…" : summary}
          </p>
        )}

        {/* Tags */}
        {pub.tags && pub.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1">
            {pub.tags.slice(0, 3).map((t, i) => (
              <span
                key={i}
                className="text-[11.5px]"
                style={{
                  color: "var(--tb-navy-900)",
                  opacity: 0.78,
                  letterSpacing: "0.04em",
                  fontFamily: '"Thmanyah Sans", sans-serif',
                }}
              >
                <span style={{ color: "var(--tb-gold)" }} className="me-1">/</span>{t}
              </span>
            ))}
          </div>
        )}

        {/* Footer meta — hairline divider + views/reading + arrow */}
        <div
          className="mt-auto pt-5 flex items-center justify-between text-[12px]"
          style={{
            borderTop: "1px solid var(--tb-hairline-soft)",
            color: "var(--tb-text-muted)",
            marginTop: 28,
          }}
        >
          <div className="flex items-center">
            <span className="inline-flex items-center gap-1.5">
              <Eye size={12} strokeWidth={1.6} />
              <span className="tabular-nums">{views.toLocaleString(lang === "ar" ? "ar-SA" : "en")}</span>
            </span>
            <span className="tb-meta-sep" />
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} strokeWidth={1.6} />
              <span>{readTime} {lang === "ar" ? "د" : "min"}</span>
            </span>
          </div>
          <span
            className="tb-card-arrow tb-read-link inline-flex items-center gap-1.5"
            style={{
              color: "var(--tb-navy-900)",
              fontSize: 12,
              letterSpacing: lang === "ar" ? "0.02em" : "0.14em",
              textTransform: "uppercase",
              fontWeight: 500,
              fontFamily: '"Thmanyah Sans", sans-serif',
            }}
          >
            <span>{lang === "ar" ? "اقرأ" : "Read"}</span>
            <Arrow size={13} strokeWidth={1.8} />
          </span>
        </div>
      </article>
    </Link>
  );
}

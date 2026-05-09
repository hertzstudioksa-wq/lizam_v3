import { Link } from "react-router-dom";
import { Eye, Clock, Lock } from "lucide-react";
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
 * Theme B — Editorial Publication Card (Nadeem-inspired).
 * Landscape image on top (16:10), then title + summary + meta row below.
 * Generous interior padding, soft-warm background, clean hover lift.
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
  const cover = pub.cover_image_url;

  return (
    <article
      className="group flex flex-col h-full overflow-hidden transition-all duration-400"
      data-testid={testid}
      data-theme-component="theme-b-card"
      style={{
        background: "var(--tb-paper-base)",
        border: "1px solid var(--tb-hairline)",
        borderRadius: "var(--tb-radius-md, 4px)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 18px 40px -22px rgba(10, 17, 28, 0.22)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <Link to={`/publications/${slug}`} className="block h-full flex flex-col">
        {/* Landscape cover */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: "16/10",
            background: cover
              ? `url(${cover}) center/cover no-repeat`
              : "linear-gradient(135deg, var(--tb-navy-900) 0%, var(--tb-navy-700, var(--tb-navy-900)) 100%)",
          }}
        >
          {!cover && (
            <div
              aria-hidden
              style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--tb-gold)", opacity: 0.4,
                fontFamily: '"Thmanyah Serif Display", serif',
                fontSize: 56, fontStyle: "italic",
              }}
            >
              ل
            </div>
          )}
          {gated && (
            <div
              className="absolute top-4 inline-flex items-center gap-1.5 px-2.5 py-1"
              style={{
                insetInlineEnd: 16,
                background: "rgba(251, 250, 247, 0.94)",
                color: "var(--tb-navy-900)",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              <Lock size={10} strokeWidth={2} />
              <span>{access}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-7 md:p-8 flex flex-col flex-1">
          <div className="flex items-center text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--tb-text-muted)" }}>
            <span style={{ color: "var(--tb-gold)", fontWeight: 600 }}>{type}</span>
            <span className="tb-meta-sep" />
            <span className="tabular-nums">{date}</span>
          </div>

          <h3
            className="tb-display mt-5"
            style={{
              fontSize: "clamp(1.25rem, 1.65vw, 1.5rem)",
              lineHeight: 1.4,
              fontWeight: 500,
              color: "var(--tb-navy-900)",
            }}
          >
            {title}
          </h3>

          {summary && (
            <p
              className="mt-4"
              style={{
                fontFamily: '"Thmanyah Serif Text", serif',
                fontSize: 14.5,
                lineHeight: 1.95,
                color: "var(--tb-text-muted)",
              }}
            >
              {summary.length > 140 ? summary.slice(0, 140) + "…" : summary}
            </p>
          )}

          <div
            className="mt-auto pt-6 flex items-center text-[12px]"
            style={{ borderTop: "1px solid var(--tb-hairline)", color: "var(--tb-text-muted)", marginTop: 28 }}
          >
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
        </div>
      </Link>
    </article>
  );
}

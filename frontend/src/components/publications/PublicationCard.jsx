import { Link } from "react-router-dom";
import { Eye, Clock, Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

function fmtDate(iso, lang) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
 * Editorial Publication Card — horizontal rule top, eyebrow row (type · date),
 * big serif title, summary, metadata row (views · reading time · access),
 * arrow link.
 */
export default function PublicationCard({ pub, compact = false, testid = "pub-card" }) {
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
    <article
      className="group bg-white border-t border-rule hover:bg-ivory-cream transition-colors duration-500"
      data-testid={testid}
    >
      <Link to={`/publications/${slug}`} className="block p-6 md:p-8 h-full">
        {/* Eyebrow row: type · date · access */}
        <div className="flex items-center justify-between gap-3 text-[11.5px] uppercase tracking-[0.18em] text-mute">
          <div className="flex items-center gap-3">
            <span className="text-brass font-semibold">{type}</span>
            <span className="opacity-40">·</span>
            <span className="tabular-nums">{date}</span>
          </div>
          {access && (
            <span className={`inline-flex items-center gap-1.5 ${gated ? "text-navy" : "text-green-700"}`}>
              {gated && <Lock size={11} strokeWidth={2} />}
              <span className="tracking-[0.1em]">{access}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={`mt-5 ${compact ? "text-[20px] md:text-[22px]" : "text-[22px] md:text-[26px]"} leading-[1.35] text-navy-deep group-hover:text-navy transition-colors duration-500`}
          style={{
            fontFamily: '"Thmanyah Serif Display", "Source Serif 4", serif',
            fontWeight: 500,
            letterSpacing: lang === "ar" ? "0" : "-0.01em",
          }}
        >
          {title}
        </h3>

        {/* Summary */}
        {summary && (
          <p className="mt-4 text-[14.5px] md:text-[15px] leading-[1.9] text-ink/75 max-w-[60ch]">
            {summary.length > 180 ? summary.slice(0, 180) + "…" : summary}
          </p>
        )}

        {/* Tags */}
        {pub.tags && pub.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {pub.tags.slice(0, 4).map((t, i) => (
              <span key={i} className="text-[11.5px] text-navy/80 tracking-wide">
                <span className="text-brass me-1">/</span>{t}
              </span>
            ))}
          </div>
        )}

        {/* Meta + CTA */}
        <div className="mt-7 flex items-center justify-between gap-4 text-[12.5px] text-mute">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Eye size={12} strokeWidth={1.6} />
              <span className="tabular-nums">{views.toLocaleString(lang === "ar" ? "ar-SA" : "en")}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} strokeWidth={1.6} />
              <span>
                {readTime} {lang === "ar" ? "دقيقة قراءة" : "min read"}
              </span>
            </span>
          </div>
          <span className="inline-flex items-center gap-2 text-navy group-hover:text-brass transition-colors duration-500">
            <span className="tracking-wide">{lang === "ar" ? "اقرأ" : "Read"}</span>
            <Arrow size={14} />
          </span>
        </div>
      </Link>
    </article>
  );
}

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Tag } from "lucide-react";
import Reveal from "@/components/theme-b/Reveal";
import PublicLayout from "@/components/layout/PublicLayout";
import { useLang } from "@/i18n/LanguageContext";
import { api } from "@/lib/api";

function fmtDate(iso, lang) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-SA-u-ca-gregory" : "en-GB", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return iso; }
}

export default function NewsDetailPage() {
  const { slug } = useParams();
  const { lang } = useLang();
  const isRtl = lang === "ar";
  const Arrow = isRtl ? ArrowRight : ArrowLeft;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/public/news/${slug}`)
      .then(({ data }) => { setItem(data); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  if (loading) return (
    <PublicLayout>
      <div className="min-h-[60vh] flex items-center justify-center text-mute">
        {isRtl ? "جارٍ التحميل…" : "Loading…"}
      </div>
    </PublicLayout>
  );

  if (notFound || !item) return (
    <PublicLayout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="text-[13px] uppercase tracking-[0.2em] text-mute">404</div>
        <h1 className="tb-display text-[2rem]">{isRtl ? "الصفحة غير موجودة" : "Page not found"}</h1>
        <Link to="/activities" className="lz-linkline text-[13.5px]">
          ← {isRtl ? "العودة للأنشطة" : "Back to Activities"}
        </Link>
      </div>
    </PublicLayout>
  );

  const title   = item[`title_${lang}`]   || item.title_ar   || item.title_en   || "";
  const summary = item[`summary_${lang}`] || item.summary_ar || item.summary_en || "";
  const body    = item[`body_${lang}`]    || item.body_ar    || item.body_en    || "";
  const category= item[`category_${lang}`]|| item.category_ar|| item.category_en|| "";

  return (
    <PublicLayout>

      {/* ── Hero ── */}
      <section
        className="relative isolate overflow-hidden pt-[140px] md:pt-[160px] pb-20 md:pb-24 min-h-[62vh]"
        style={{ background: "var(--tb-navy-900, #0A111C)", color: "var(--tb-paper-base, #FBFAF7)" }}
      >
        {item.cover_image_url && (
          <img src={item.cover_image_url} alt={title}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ opacity: 0.35 }} />
        )}
        <div className="relative z-10 mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14 flex flex-col justify-end h-full min-h-[40vh]">
          {category && (
            <Reveal variant="up">
              <div className="flex items-center gap-3 mb-2">
                <span style={{ height: 1, width: 26, background: "var(--tb-gold,#B08C5A)" }} />
                <span className="tb-overline" style={{ color: "var(--tb-gold,#B08C5A)" }}>{category}</span>
              </div>
            </Reveal>
          )}
          <Reveal variant="up" delay={1}>
            <h1 className="tb-display mt-3 max-w-[26ch]" style={{ fontSize: "clamp(2rem,3.6vw,3rem)", lineHeight: 1.2 }}>
              {title}
            </h1>
          </Reveal>
          {summary && (
            <Reveal variant="up" delay={2}>
              <p className="mt-6 max-w-[58ch]" style={{ fontSize: "1.0625rem", lineHeight: 1.85, color: "rgba(251,250,247,0.82)", whiteSpace: "pre-line" }}>
                {summary}
              </p>
            </Reveal>
          )}
          <div className="mt-6 flex items-center gap-4 text-[12px]" style={{ color: "rgba(251,250,247,0.5)" }}>
            {item.date && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={12} strokeWidth={1.4} />
                {fmtDate(item.date, lang)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="py-16 md:py-24" style={{ background: "var(--tb-ivory,#F7F5F0)" }}>
        <div className="mx-auto max-w-[780px] px-6 md:px-10">

          {body ? (
            <div
              className="lz-prose"
              style={{ fontSize: "clamp(15px,1.4vw,17px)", lineHeight: 1.95, color: "rgba(28,37,51,0.82)" }}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : summary ? (
            <p style={{ fontSize: "clamp(15px,1.4vw,17px)", lineHeight: 1.95, color: "rgba(28,37,51,0.82)", whiteSpace: "pre-line" }}>
              {summary}
            </p>
          ) : null}

          {/* Back link */}
          <div className="mt-14 pt-8" style={{ borderTop: "1px solid rgba(28,37,51,0.1)" }}>
            <Link
              to="/activities"
              className="inline-flex items-center gap-2 text-[13.5px] hover:text-brass transition-colors"
              style={{ color: "var(--tb-navy-deep,#0A111C)", letterSpacing: "0.04em" }}
            >
              <Arrow size={14} strokeWidth={1.6} />
              <span>{isRtl ? "العودة إلى الأنشطة والفعاليات" : "Back to Activities"}</span>
            </Link>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}

import { Link } from "react-router-dom";
import { ArrowRight, Lock, FileDown } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePublication, usePublications } from "@/hooks/usePublications";
import { api, formatApiError } from "@/lib/api";

const FALLBACK_COVER = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?crop=entropy&cs=srgb&fm=jpg&q=85&w=2400";

export default function PublicationDetailC({ slug }) {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const { data: pub, loading, error } = usePublication(slug);
  const { data: site } = useSiteSettings();
  const toggles = (site && site.feature_toggles) || {};
  const pdfDownloadEnabled = pub?._pdf_download_enabled ?? (toggles.pdf_download !== false);
  const registrationEnabled = pub?._registration_enabled ?? (toggles.registration !== false);
  const { data: relatedData } = usePublications({ limit: 4, sort: "latest" });
  const isAuthed = user && typeof user === "object";

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[80vh] flex items-center justify-center" style={{ color: "var(--tc-text-muted)" }}>
          {t("common.loading")}
        </div>
      </PublicLayout>
    );
  }
  if (error || !pub) {
    return (
      <PublicLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
          <div className="tc-overline">404</div>
          <h1 className="mt-4 text-3xl font-semibold" style={{ color: "var(--tc-navy)" }}>
            {lang === "ar" ? "الإصدار غير موجود" : "Publication not found"}
          </h1>
          <Link to="/publications" className="tc-btn-ghost-dark mt-6">
            {lang === "ar" ? "العودة إلى المكتبة" : "Back to library"}
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const title = (lang === "ar" ? pub.title_ar : pub.title_en) || pub.title_ar || pub.title_en;
  const summary = lang === "ar" ? pub.summary_ar : pub.summary_en;
  const html = lang === "ar" ? pub.content_html_ar : pub.content_html_en;
  const cover = pub.cover_image_url || FALLBACK_COVER;
  const gated = pub._gated;
  const gatedReason = pub._gated_reason;
  const pdfAccess = pub.pdf_access_level || "public";
  const hasPdfConfigured = !!(pub.pdf_file_url || pub.external_pdf_url);

  const downloadPdf = async () => {
    try {
      const slugForApi = pub.slug_ar || pub.slug_en || pub.id;
      const { data } = await api.get(`/public/publications/${slugForApi}/pdf`);
      if (data?.token) {
        window.open(`${api.defaults.baseURL}/public/pdf-stream/${data.token}`, "_blank");
      }
    } catch (e) {
      alert(formatApiError(e.response?.data?.detail) || e.message);
    }
  };

  const related = (relatedData?.items || []).filter((p) => p.id !== pub.id).slice(0, 3);

  return (
    <PublicLayout>
      {/* Editorial cover */}
      <section
        className="tc-detail-cover"
        style={{ backgroundImage: `url("${cover}")` }}
        data-testid="pub-cover"
      >
        <div className="relative z-10 h-full flex items-end pb-12 md:pb-20">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10 lg:px-14 w-full">
            <div className="tc-eyebrow-light">
              <span className="inline-block w-8 h-px align-middle me-3" style={{ background: "var(--tc-gold)" }} />
              {pub.publication_type?.replace("_", " ")} · {(pub.published_at || pub.created_at || "").slice(0, 10)}
            </div>
            <h1
              className="mt-6 text-[34px] md:text-[48px] lg:text-[60px] leading-[1.1] font-semibold max-w-[20ch]"
              style={{ color: "var(--tc-ivory)", fontFamily: lang === "ar" ? 'var(--lz-font-ar, "Thmanyah Serif Display"), serif' : '"Source Serif 4", serif' }}
              data-testid="pub-title"
            >
              {title}
            </h1>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 md:py-24" style={{ background: "var(--tc-ivory)" }}>
        <div className="mx-auto max-w-[1100px] px-6 md:px-10 lg:px-14 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Sidebar metadata */}
          <aside className="lg:col-span-3 lg:sticky lg:top-[100px] self-start">
            <div className="tc-overline">{lang === "ar" ? "تفاصيل" : "Details"}</div>
            <div className="mt-6 space-y-6 text-[14px]">
              {pub.authors && pub.authors.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--tc-text-muted)" }}>{lang === "ar" ? "الباحثون" : "Authors"}</div>
                  <div className="mt-2 space-y-1.5" style={{ color: "var(--tc-navy)" }}>
                    {pub.authors.map((a) => (
                      <div key={a.id || a.name_ar || a.name_en}>{lang === "ar" ? a.name_ar : a.name_en}</div>
                    ))}
                  </div>
                </div>
              )}
              {pub.reading_time_minutes ? (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--tc-text-muted)" }}>{lang === "ar" ? "وقت القراءة" : "Reading"}</div>
                  <div className="mt-1 tabular-nums" style={{ color: "var(--tc-navy)" }}>
                    {pub.reading_time_minutes} {lang === "ar" ? "دقيقة" : "min"}
                  </div>
                </div>
              ) : null}
              {pub.tags && pub.tags.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--tc-text-muted)" }}>{lang === "ar" ? "وسوم" : "Tags"}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pub.tags.map((tag) => <span key={tag} className="text-[12px] px-2 py-0.5" style={{ background: "var(--tc-ivory-dark)", color: "var(--tc-navy)" }}>{tag}</span>)}
                  </div>
                </div>
              )}
              {pdfDownloadEnabled && hasPdfConfigured && pdfAccess !== "disabled" && (
                <button onClick={downloadPdf} className="tc-btn-primary mt-4 w-full justify-center" data-testid="pdf-download">
                  <FileDown size={16} />
                  <span>{lang === "ar" ? "تحميل PDF" : "Download PDF"}</span>
                </button>
              )}
            </div>
          </aside>

          {/* Article body */}
          <article className="lg:col-span-9" data-testid="pub-body">
            {summary && (
              <p
                className="text-[18px] md:text-[20px] leading-[1.7] mb-10 max-w-[68ch]"
                style={{ color: "var(--tc-text-main)", fontFamily: lang === "ar" ? 'var(--lz-font-ar, "Thmanyah Sans"), sans-serif' : '"Inter", sans-serif' }}
                data-testid="pub-summary"
              >
                {summary}
              </p>
            )}
            <div className="h-px w-12 mb-10" style={{ background: "var(--tc-gold)" }} />

            {gated ? (
              <GatedNotice
                gatedReason={gatedReason}
                isAuthed={isAuthed}
                lang={lang}
                registrationEnabled={registrationEnabled}
                previewHtml={lang === "ar" ? pub.preview_html_ar : pub.preview_html_en}
              />
            ) : (
              <div
                className="tc-prose"
                dangerouslySetInnerHTML={{ __html: html || "" }}
                dir={lang === "ar" ? "rtl" : "ltr"}
                data-testid="pub-html"
              />
            )}
          </article>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="py-20 border-t" style={{ background: "var(--tc-ivory)", borderColor: "var(--tc-rule)" }}>
          <div className="mx-auto max-w-[1100px] px-6 md:px-10 lg:px-14">
            <div className="tc-overline">{lang === "ar" ? "اقتراحات تحريرية" : "Editorial suggestions"}</div>
            <h3 className="mt-4 text-[28px] md:text-[34px] font-semibold mb-10" style={{ color: "var(--tc-navy)", fontFamily: lang === "ar" ? 'var(--lz-font-ar, "Thmanyah Serif Display"), serif' : '"Source Serif 4", serif' }}>
              {lang === "ar" ? "اقرأ أيضاً" : "Continue reading"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {related.map((p, i) => (
                <Link key={p.id} to={`/publications/${p.slug_ar || p.slug_en || p.id}`} className="group block" data-testid={`related-${p.id}`}>
                  <div className="relative w-full aspect-[4/3] overflow-hidden" style={{ background: "var(--tc-ivory-dark)" }}>
                    <img src={p.cover_image_url || FALLBACK_COVER} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                  </div>
                  <div className="mt-4 text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--tc-text-muted)" }}>
                    {String(i + 1).padStart(2, "0")} · {p.publication_type?.replace("_", " ")}
                  </div>
                  <h4
                    className="mt-2 text-[18px] md:text-[20px] leading-[1.3] font-semibold transition-colors duration-200 group-hover:text-[var(--tc-gold)]"
                    style={{ color: "var(--tc-navy)", fontFamily: lang === "ar" ? 'var(--lz-font-ar, "Thmanyah Serif Display"), serif' : '"Source Serif 4", serif' }}
                  >
                    {lang === "ar" ? p.title_ar : p.title_en}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}

function GatedNotice({ gatedReason, isAuthed, lang, registrationEnabled, previewHtml }) {
  return (
    <div data-testid="gated-notice">
      {gatedReason === "preview_only" && previewHtml && (
        <div className="tc-prose" dangerouslySetInnerHTML={{ __html: previewHtml }} dir={lang === "ar" ? "rtl" : "ltr"} />
      )}
      <div className="mt-10 p-8 md:p-10 border-l-2" style={{ borderColor: "var(--tc-gold)", background: "var(--tc-ivory-dark)" }}>
        <div className="flex items-start gap-4">
          <Lock size={20} style={{ color: "var(--tc-gold)" }} className="mt-1 shrink-0" />
          <div>
            <div className="tc-overline">{lang === "ar" ? "محتوى مقفل" : "Gated content"}</div>
            <h3 className="mt-3 text-[22px] md:text-[26px] font-semibold" style={{ color: "var(--tc-navy)", fontFamily: lang === "ar" ? 'var(--lz-font-ar, "Thmanyah Serif Display"), serif' : '"Source Serif 4", serif' }}>
              {lang === "ar" ? "تتمة المحتوى متاحة للأعضاء المسجّلين." : "The full text is available to registered members."}
            </h3>
            <p className="mt-3 text-[15px] leading-[1.7]" style={{ color: "var(--tc-text-muted)" }}>
              {lang === "ar"
                ? "أنشئ حساباً مجانياً للوصول للنص الكامل والإصدارات المؤرشفة."
                : "Create a free account to access the full text and the archived volumes."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {!isAuthed && (
                <>
                  <Link to="/login" className="tc-btn-primary" data-testid="gated-signin">
                    {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
                    <ArrowRight size={14} className={lang === "ar" ? "rotate-180" : ""} />
                  </Link>
                  {registrationEnabled && (
                    <Link to="/register" className="tc-btn-ghost-dark" data-testid="gated-register">
                      {lang === "ar" ? "إنشاء حساب" : "Create account"}
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Eye, Clock, Lock, FileDown, Share2, Copy, Twitter, Linkedin,
  ChevronLeft, ChevronRight, MessageSquare, Check, Mail, Quote,
} from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import PublicationCard from "@/components/publications/PublicationCard";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { usePublication } from "@/hooks/usePublications";
import { api, formatApiError } from "@/lib/api";

function fmtDate(iso, lang) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return iso.slice(0, 10); }
}

const TYPE_LABELS = {
  ar: { study: "دراسة", policy_paper: "ورقة سياسات", research: "بحث", report: "تقرير", essay: "مقالة", opinion: "رأي" },
  en: { study: "Study", policy_paper: "Policy Paper", research: "Research", report: "Report", essay: "Essay", opinion: "Opinion" },
};

export default function PublicationDetailPage() {
  const { slug } = useParams();
  const { lang, t } = useLang();
  const { user } = useAuth();
  const nav = useNavigate();
  const { data: pub, loading, error } = usePublication(slug);
  const [tab, setTab] = useState("article");
  const [copied, setCopied] = useState(false);
  const [pdfState, setPdfState] = useState(null);
  const [showCite, setShowCite] = useState(false);
  const [citedStyle, setCitedStyle] = useState(null);

  if (loading) {
    return (
      <PublicLayout>
        <div className="pt-[160px] pb-24 text-center text-mute">{t("common.loading")}</div>
      </PublicLayout>
    );
  }
  if (error || !pub) {
    return (
      <PublicLayout>
        <section className="pt-[150px] pb-28">
          <div className="mx-auto max-w-[720px] px-6 text-center">
            <div className="lz-eyebrow text-mute">{lang === "ar" ? "خطأ" : "Error"}</div>
            <h1 className="lz-h2 mt-4">
              {lang === "ar" ? "لم يتم العثور على الإصدار." : "Publication not found."}
            </h1>
            <Link to="/publications" className="lz-btn-ghost mt-6 inline-flex">
              {lang === "ar" ? "العودة للإصدارات" : "Back to publications"}
            </Link>
          </div>
        </section>
      </PublicLayout>
    );
  }

  const title = pub[`title_${lang}`];
  const summary = pub[`summary_${lang}`];
  const html = pub[`content_html_${lang}`];
  const gated = pub._gated;
  const gatedReason = pub._gated_reason;
  const isAuthed = user && typeof user === "object";
  const type = TYPE_LABELS[lang][pub.publication_type] || pub.publication_type;
  const authors = pub.authors || [];
  const category = pub.category;
  const related = pub.related || [];
  const pdfAccess = pub.pdf_access_level;
  const hasPdfConfigured = pub.pdf_file_url || pub.external_pdf_url;
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;

  async function handlePdf() {
    setPdfState(null);
    try {
      const { data } = await api.get(`/public/publications/${pub.id}/pdf`);
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const fullUrl = `${backendUrl}${data.stream_url}`;
      setPdfState({ ok: true, url: fullUrl });
      window.open(fullUrl, "_blank", "noopener");
    } catch (e) {
      setPdfState({ ok: false, error: formatApiError(e.response?.data?.detail) || e.message, status: e.response?.status });
    }
  }

  async function shareCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  }

  function buildCitation(style) {
    const authorsText = authors.length
      ? authors.map((a) => a[`name_${lang}`] || a.name_en || a.name_ar).join(", ")
      : (lang === "ar" ? "مركز لزام للدراسات القانونية" : "LIZAM Center for Legal Research");
    const year = (pub.published_at || "").slice(0, 4) || new Date().getFullYear();
    const publisher = lang === "ar" ? "مركز لزام للدراسات القانونية" : "LIZAM Center for Legal Research";
    const url = window.location.href;
    if (style === "apa") {
      return `${authorsText} (${year}). ${title}. ${publisher}. ${url}`;
    }
    // chicago
    return `${authorsText}. "${title}." ${publisher}, ${year}. ${url}`;
  }

  async function copyCitation(style) {
    try {
      await navigator.clipboard.writeText(buildCitation(style));
      setCitedStyle(style);
      setTimeout(() => setCitedStyle(null), 1500);
    } catch { /* noop */ }
  }

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
    mail: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(window.location.href)}`,
  };

  return (
    <PublicLayout>
      {/* Masthead */}
      <section className="pt-[130px] md:pt-[150px] pb-10 md:pb-14 bg-ivory" data-testid="publication-masthead">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14">
          <nav className="flex items-center gap-2 text-[12.5px] text-mute">
            <Link to="/" className="hover:text-navy transition-colors">{lang === "ar" ? "الرئيسية" : "Home"}</Link>
            <Chevron size={12} />
            <Link to="/publications" className="hover:text-navy transition-colors">{lang === "ar" ? "الإصدارات" : "Publications"}</Link>
            {category && (<>
              <Chevron size={12} />
              <span className="text-navy/70">{category[`title_${lang}`]}</span>
            </>)}
          </nav>

          <div className="mt-8 flex items-center gap-3 text-[11.5px] uppercase tracking-[0.22em] text-brass font-semibold">
            <span className="h-px w-10 bg-brass" />
            <span>{type}</span>
          </div>

          <h1
            className="lz-display mt-5 max-w-[30ch]"
            style={{ color: "#121A2A", fontWeight: 500 }}
            data-testid="pub-title"
          >
            {title}
          </h1>

          {summary && (
            <p className="mt-7 text-[17px] md:text-[19px] leading-[1.9] text-ink/80 max-w-[66ch]" data-testid="pub-summary">
              {summary}
            </p>
          )}

          {/* Meta line */}
          <div className="mt-10 pt-6 border-t border-rule flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] text-mute" data-testid="pub-meta">
            {authors.length > 0 && (
              <div>
                <span className="lz-eyebrow me-2">{lang === "ar" ? "الباحث" : "Researcher"}</span>
                <span className="text-navy font-medium">
                  {authors.map((a) => a[`name_${lang}`]).join(" · ")}
                </span>
              </div>
            )}
            <div>
              <span className="lz-eyebrow me-2">{lang === "ar" ? "تاريخ النشر" : "Published"}</span>
              <span className="tabular-nums">{fmtDate(pub.published_at, lang)}</span>
            </div>
            {pub.updated_at && pub.updated_at !== pub.published_at && (
              <div>
                <span className="lz-eyebrow me-2">{lang === "ar" ? "آخر تحديث" : "Updated"}</span>
                <span className="tabular-nums">{fmtDate(pub.updated_at, lang)}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5">
              <Clock size={13} />
              <span>{pub.reading_time_minutes} {lang === "ar" ? "دقيقة قراءة" : "min read"}</span>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <Eye size={13} />
              <span className="tabular-nums">{(pub.view_count || 0).toLocaleString(lang === "ar" ? "ar-SA" : "en")}</span>
            </div>
            {pub.access_level !== "public" && (
              <div className="inline-flex items-center gap-1.5 text-navy">
                <Lock size={13} />
                <span>{pub.access_level === "registered" ? (lang === "ar" ? "للمسجلين" : "Members only") : (lang === "ar" ? "معاينة + تسجيل" : "Preview + login")}</span>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="mt-8 flex flex-wrap items-center gap-3" data-testid="pub-actions">
            {hasPdfConfigured && pdfAccess !== "disabled" && (
              <button
                type="button"
                onClick={handlePdf}
                className="lz-btn-primary"
                data-testid="pdf-download"
              >
                <FileDown size={16} strokeWidth={1.8} />
                <span>{lang === "ar" ? "تحميل PDF" : "Download PDF"}</span>
              </button>
            )}

            <div className="flex items-center gap-2 ms-auto">
              <div className="relative">
                <button onClick={() => setShowCite((s) => !s)}
                  className="h-10 px-3 border border-rule hover:border-navy transition-colors inline-flex items-center gap-2 text-[12.5px] text-navy"
                  data-testid="cite-btn">
                  <Quote size={14} />
                  <span>{lang === "ar" ? "استشهاد" : "Cite"}</span>
                </button>
                {showCite && (
                  <div className="absolute top-full end-0 mt-2 w-[320px] bg-white border border-rule shadow-sm z-10" data-testid="cite-dropdown">
                    <div className="p-4 border-b border-rule">
                      <div className="lz-eyebrow text-mute">{lang === "ar" ? "نسق الاستشهاد" : "Citation format"}</div>
                    </div>
                    {["apa", "chicago"].map((s) => (
                      <button key={s} onClick={() => copyCitation(s)}
                        className="w-full text-start px-4 py-3 text-[13px] hover:bg-ivory-cream transition-colors border-b border-rule last:border-0 flex items-start justify-between gap-2"
                        data-testid={`cite-${s}`}>
                        <div>
                          <div className="font-medium text-navy uppercase tracking-wider text-[11px] mb-1">{s}</div>
                          <div className="text-ink/70 leading-[1.7] text-[12.5px]" dir="auto">{buildCitation(s).slice(0, 120)}…</div>
                        </div>
                        {citedStyle === s && <Check size={14} className="text-green-700 mt-0.5 shrink-0" />}
                      </button>
                    ))}
                    <div className="px-4 py-2 text-[11.5px] text-mute">
                      {lang === "ar" ? "اضغط للنسخ" : "Click to copy"}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={shareCopy} className="h-10 px-3 border border-rule hover:border-navy transition-colors inline-flex items-center gap-2 text-[12.5px] text-navy" data-testid="share-copy">
                {copied ? <Check size={14} className="text-green-700" /> : <Copy size={14} />}
                <span>{copied ? (lang === "ar" ? "تم النسخ" : "Copied") : (lang === "ar" ? "نسخ الرابط" : "Copy link")}</span>
              </button>
              <a href={shareUrls.twitter} target="_blank" rel="noopener" className="h-10 w-10 inline-flex items-center justify-center border border-rule hover:border-navy transition-colors" aria-label="Share on Twitter" data-testid="share-twitter">
                <Twitter size={15} />
              </a>
              <a href={shareUrls.linkedin} target="_blank" rel="noopener" className="h-10 w-10 inline-flex items-center justify-center border border-rule hover:border-navy transition-colors" aria-label="Share on LinkedIn" data-testid="share-linkedin">
                <Linkedin size={15} />
              </a>
              <a href={shareUrls.mail} className="h-10 w-10 inline-flex items-center justify-center border border-rule hover:border-navy transition-colors" aria-label="Share via email" data-testid="share-mail">
                <Mail size={15} />
              </a>
            </div>
          </div>

          {/* PDF feedback */}
          {pdfState && !pdfState.ok && (
            <div className="mt-4 text-[13px] border border-destructive/30 bg-destructive/5 text-destructive px-3 py-2" data-testid="pdf-error">
              {pdfState.status === 401 ? (lang === "ar" ? "يرجى تسجيل الدخول لتحميل الملف." : "Please sign in to download the PDF.") : pdfState.error}
              {pdfState.status === 401 && (
                <button onClick={() => nav("/login", { state: { from: { pathname: window.location.pathname } } })} className="lz-linkline ms-3 text-navy">
                  {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Tabs: article / responses */}
      <section className="bg-ivory border-t border-rule" data-testid="publication-body">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14">
          <div className="flex items-center gap-8 border-b border-rule text-[13.5px]">
            <button
              onClick={() => setTab("article")}
              className={`h-14 inline-flex items-center gap-2 transition-colors duration-300 ${tab === "article" ? "text-navy-deep border-b-2 border-brass" : "text-mute hover:text-navy"}`}
              data-testid="tab-article"
            >
              <span>{lang === "ar" ? "نص الدراسة" : "Article"}</span>
            </button>
            <button
              onClick={() => setTab("responses")}
              className={`h-14 inline-flex items-center gap-2 transition-colors duration-300 ${tab === "responses" ? "text-navy-deep border-b-2 border-brass" : "text-mute hover:text-navy"}`}
              data-testid="tab-responses"
            >
              <MessageSquare size={13} />
              <span>{lang === "ar" ? "الردود والمداخلات" : "Responses"}</span>
            </button>
          </div>

          <div className="py-12 md:py-16">
            {tab === "article" ? (
              <ArticleBody
                gated={gated}
                gatedReason={gatedReason}
                html={html}
                lang={lang}
                isAuthed={isAuthed}
                onLogin={() => nav("/login", { state: { from: { pathname: window.location.pathname } } })}
              />
            ) : (
              <ResponsesPlaceholder lang={lang} />
            )}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-paper border-t border-rule" data-testid="related-section">
          <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 py-20">
            <div className="lz-eyebrow text-navy/70">
              {lang === "ar" ? "إصدارات مرتبطة" : "Related publications"}
            </div>
            <div className="mt-3 h-px w-12 bg-brass" />
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-rule border border-rule">
              {related.map((r) => (
                <PublicationCard key={r.id} pub={r} testid={`related-${r.id}`} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}

function ArticleBody({ gated, gatedReason, html, lang, isAuthed, onLogin }) {
  return (
    <article className="lz-prose" data-testid="article-body">
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="text-mute">{lang === "ar" ? "لا يوجد محتوى منشور بعد." : "No published content yet."}</p>
      )}

      {gated && (
        <aside
          className="mt-10 border border-navy/15 bg-white p-7 md:p-9 relative overflow-hidden"
          data-testid="gated-notice"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-brass" />
          <div className="lz-eyebrow text-navy/70 inline-flex items-center gap-2">
            <Lock size={12} />
            <span>{gatedReason === "preview_only" ? (lang === "ar" ? "معاينة فقط" : "Preview only") : (lang === "ar" ? "محتوى للأعضاء" : "Members only")}</span>
          </div>
          <h3 className="lz-h3 mt-4">
            {gatedReason === "preview_only"
              ? (lang === "ar" ? "تابع قراءة الدراسة بعد تسجيل الدخول." : "Continue reading the full study after signing in.")
              : (lang === "ar" ? "هذا المحتوى متاح للأعضاء المسجلين." : "This content is available to registered members.")}
          </h3>
          <p className="mt-3 text-[14.5px] leading-[1.9] text-ink/75 max-w-[60ch]">
            {lang === "ar"
              ? "التسجيل مجاني ويُتيح لك الوصول للمحتوى المقفل وإرسال الردود البحثية على إصدارات المركز."
              : "Registration is free and unlocks gated content along with the ability to submit research responses."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {!isAuthed ? (
              <>
                <button onClick={onLogin} className="lz-btn-primary" data-testid="gated-signin">
                  {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
                </button>
                <Link to="/register" className="lz-btn-ghost" data-testid="gated-register">
                  {lang === "ar" ? "حساب جديد" : "Create account"}
                </Link>
              </>
            ) : (
              <span className="text-[13px] text-mute">
                {lang === "ar" ? "يرجى التواصل مع الإدارة لرفع صلاحيات حسابك." : "Please contact the admin to upgrade your membership."}
              </span>
            )}
          </div>
        </aside>
      )}
    </article>
  );
}

function ResponsesPlaceholder({ lang }) {
  return (
    <div className="border border-rule bg-white p-8 md:p-10 text-center" data-testid="responses-placeholder">
      <div className="lz-eyebrow text-navy/70">
        {lang === "ar" ? "قريباً" : "Coming soon"}
      </div>
      <div className="mt-3 h-px w-10 bg-brass mx-auto" />
      <h3 className="lz-h3 mt-6">
        {lang === "ar" ? "الردود البحثية مفتوحة للتسجيل في المرحلة القادمة." : "Research responses will open in the next phase."}
      </h3>
      <p className="mt-3 text-[14.5px] leading-[1.9] text-mute max-w-[60ch] mx-auto">
        {lang === "ar"
          ? "سيتمكّن الأعضاء المسجلون قريباً من إرسال ردود علمية على هذه الدراسة، تمر بمراجعة فريق المركز قبل النشر العلني."
          : "Registered members will soon be able to submit scholarly responses that are moderated by the editorial team before public display."}
      </p>
    </div>
  );
}

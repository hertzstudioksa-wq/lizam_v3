import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Eye, Clock, Lock, FileDown, Share2, Copy, Twitter, Linkedin,
  ChevronLeft, ChevronRight, MessageSquare, Check, Mail, Quote,
} from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import PublicationCard from "@/components/publications/PublicationCard";
import HeroMediaLayer from "@/components/hero/HeroMediaLayer";
import Reveal from "@/components/theme-b/Reveal";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { usePublication } from "@/hooks/usePublications";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { api, formatApiError, BACKEND_URL } from "@/lib/api";

function fmtDate(iso, lang) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-SA-u-ca-gregory" : "en-GB", {
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
  const { data: site } = useSiteSettings();
  const toggles = (site && site.feature_toggles) || {};
  // Prefer the publication payload (always reflects backend) and fall back to
  // site-settings toggle so the UI stays consistent if the SPA cache is stale.
  const pdfDownloadEnabled =
    pub?._pdf_download_enabled ?? (toggles.pdf_download !== false);
  const registrationEnabled =
    pub?._registration_enabled ?? (toggles.registration !== false);
  const [tab, setTab] = useState("article");
  const [copied, setCopied] = useState(false);
  const [pdfState, setPdfState] = useState(null);
  const [showCite, setShowCite] = useState(false);
  const [citedStyle, setCitedStyle] = useState(null);
  // Arrows visibility — hooks must be before early returns
  const articleSectionRef = useRef(null);
  const [arrowsVisible, setArrowsVisible] = useState(false);
  useEffect(() => {
    function check() {
      const el = articleSectionRef.current;
      if (!el) { setArrowsVisible(false); return; }
      const { top, bottom } = el.getBoundingClientRect();
      setArrowsVisible(top < window.innerHeight - 80 && bottom > 80);
    }
    check(); // run immediately on mount/update
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pub]);

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
  const prevPub = pub._prev || null;
  const nextPub = pub._next || null;
  const pdfAccess = pub.pdf_access_level;
  const hasPdfConfigured = pub.pdf_file_url || pub.external_pdf_url;
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;

  async function handlePdf() {
    setPdfState(null);
    try {
      const { data } = await api.get(`/public/publications/${pub.id}/pdf`);
      const fullUrl = `${BACKEND_URL}${data.stream_url}`;
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
      {/* Cinematic masthead — matches /publications, /about, /contact heights */}
      <section
        className="relative isolate overflow-hidden pt-[140px] md:pt-[160px] pb-20 md:pb-24 min-h-[62vh]"
        style={{ background: "var(--tb-navy-900, #0A111C)", color: "var(--tb-paper-base, #FBFAF7)" }}
        data-testid="publication-hero"
      >
        <HeroMediaLayer pageKey="publication_detail" extendBehindHeader />
        <div className="relative z-10 mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14 flex flex-col justify-end h-full min-h-[40vh]">
          <Reveal variant="up">
            <div className="flex items-center gap-3 mb-2">
              <span style={{ height: 1, width: 26, background: "var(--tb-gold)" }} />
              <span className="tb-overline" style={{ color: "var(--tb-gold)" }}>{type}</span>
            </div>
          </Reveal>
          <Reveal variant="up" delay={1}>
            <h1
              className="tb-display mt-3 max-w-[30ch]"
              style={{ color: "var(--tb-paper-base)", fontWeight: 500, fontSize: "clamp(2rem, 3.6vw, 3rem)", lineHeight: 1.2 }}
              data-testid="pub-title"
            >
              {title}
            </h1>
          </Reveal>
          <Reveal variant="up" delay={2}>
            <nav className="mt-5 flex items-center gap-2 text-[12px] uppercase tracking-[0.18em]" style={{ color: "rgba(251,250,247,0.55)" }}>
              <Link to="/" className="hover:text-white transition-colors">{lang === "ar" ? "الرئيسية" : "Home"}</Link>
              <Chevron size={11} />
              <Link to="/publications" className="hover:text-white transition-colors">{lang === "ar" ? "الإصدارات" : "Publications"}</Link>
              {category && (<>
                <Chevron size={11} />
                <span style={{ color: "var(--tb-gold)" }}>{category[`title_${lang}`]}</span>
              </>)}
            </nav>
          </Reveal>
        </div>
      </section>

      {/* Summary + meta + actions on light band */}
      <section className="pb-10 md:pb-14 bg-ivory" data-testid="publication-masthead">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14 pt-12 md:pt-14">
          {summary && (
            <p className="text-[17px] md:text-[19px] leading-[1.9] text-ink/80 max-w-[66ch]" data-testid="pub-summary">
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
            {pub.pdf_download_count > 0 && (
              <div className="inline-flex items-center gap-1.5">
                <FileDown size={13} />
                <span className="tabular-nums">{(pub.pdf_download_count).toLocaleString(lang === "ar" ? "ar-SA" : "en")}</span>
              </div>
            )}
            {pub.access_level !== "public" && (
              <div className="inline-flex items-center gap-1.5 text-navy">
                <Lock size={13} />
                <span>{pub.access_level === "registered" ? (lang === "ar" ? "للمسجلين" : "Members only") : (lang === "ar" ? "معاينة + تسجيل" : "Preview + login")}</span>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="mt-8 flex flex-wrap items-center gap-3" data-testid="pub-actions">
            {pdfDownloadEnabled && hasPdfConfigured && pdfAccess !== "disabled" && (
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

      {/* ── Page-edge navigation arrows ── */}
      <PubNavArrow pub={prevPub} lang={lang} side="prev" visible={arrowsVisible} />
      <PubNavArrow pub={nextPub} lang={lang} side="next" visible={arrowsVisible} />

      {/* Article + Sticky Sidebar */}
      <section ref={articleSectionRef} className="bg-ivory border-t border-rule" data-testid="publication-body">
        <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14">

          {/* Tabs — full width */}
          <div className="flex items-center gap-8 border-b border-rule text-[13.5px]">
            <button onClick={() => setTab("article")}
              className={`h-14 inline-flex items-center gap-2 transition-colors duration-300 ${tab === "article" ? "text-navy-deep border-b-2 border-brass" : "text-mute hover:text-navy"}`}
              data-testid="tab-article">
              <span>{lang === "ar" ? "نص الدراسة" : "Article"}</span>
            </button>
            <button onClick={() => setTab("responses")}
              className={`h-14 inline-flex items-center gap-2 transition-colors duration-300 ${tab === "responses" ? "text-navy-deep border-b-2 border-brass" : "text-mute hover:text-navy"}`}
              data-testid="tab-responses">
              <MessageSquare size={13} />
              <span>{lang === "ar" ? "الردود والمداخلات" : "Responses"}</span>
            </button>
          </div>

          {/* Two-column layout: article + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-12 md:py-16" style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>

            {/* ── Main article ── */}
            <div className="lg:col-span-2">
              {tab === "article" ? (
                <ArticleBody
                  gated={gated} gatedReason={gatedReason} html={html} lang={lang}
                  isAuthed={isAuthed} registrationEnabled={registrationEnabled}
                  onLogin={() => nav("/login", { state: { from: { pathname: window.location.pathname } } })}
                />
              ) : (
                <ResponsesTab lang={lang} slug={pub.slug_ar || pub.slug_en}
                  isAuthed={isAuthed} responsesEnabled={pub.responses_enabled !== false}
                  userName={user?.name} userEmail={user?.email} />
              )}
            </div>

            {/* ── Sticky Sidebar ── */}
            <div>
              <div className="lg:sticky lg:top-8 space-y-8" data-testid="article-sidebar">

                {/* Author(s) */}
                {authors.length > 0 && (
                  <div>
                    <SidebarHeading>
                      {authors.length === 1
                        ? (lang === "ar" ? "الباحث" : "Researcher")
                        : (lang === "ar" ? "الباحثون" : "Researchers")}
                    </SidebarHeading>
                    <div className="space-y-4 mt-4">
                      {authors.map((a) => <SidebarAuthorCard key={a.id} author={a} lang={lang} />)}
                    </div>
                  </div>
                )}

                {/* Related publications */}
                {related.length > 0 && (
                  <div>
                    <SidebarHeading>
                      {lang === "ar" ? "إصدارات ذات صلة" : "Related publications"}
                    </SidebarHeading>
                    <div className="space-y-3 mt-4">
                      {related.slice(0, 5).map((r) => (
                        <SidebarPubCard key={r.id} pub={r} lang={lang} />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

/* ── Sidebar helpers ── */

function SidebarHeading({ children }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span style={{ height: 1, width: 18, background: "var(--tb-gold, #B08C5A)", flexShrink: 0 }} />
      <span className="tb-overline" style={{ color: "var(--tb-gold, #B08C5A)" }}>
        {children}
      </span>
    </div>
  );
}

function SidebarAuthorCard({ author, lang }) {
  const name  = author[`name_${lang}`]  || author.name_en  || author.name_ar  || "";
  const title = author[`title_${lang}`] || author.title_en || author.title_ar || "";
  const bio   = author[`bio_${lang}`]   || author.bio_en   || author.bio_ar   || "";

  return (
    <div className="bg-white p-4" style={{ border: "1px solid rgba(28,37,51,0.1)" }}>
      {/* Photo — big */}
      <div className="mb-3">
        {author.photo_url ? (
          <img src={author.photo_url} alt={name}
            className="w-full object-cover"
            style={{ maxHeight: 200, border: "1px solid rgba(28,37,51,0.08)" }} />
        ) : (
          <div className="w-full h-28 flex items-center justify-center"
            style={{ background: "var(--tb-navy-900, #0A111C)", color: "rgba(251,250,247,0.5)", fontFamily: '"Thmanyah Serif Display", serif', fontSize: 42 }}>
            {name.charAt(0)}
          </div>
        )}
      </div>
      <div className="text-[15px] font-medium text-navy-deep leading-snug"
        style={{ fontFamily: '"Thmanyah Serif Display", serif' }}>
        {name}
      </div>
      {title && (
        <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-brass">{title}</div>
      )}
      {bio && (
        <p className="mt-2 text-[12.5px] text-ink/65 leading-[1.7] line-clamp-4">{bio}</p>
      )}
      {(author.linkedin || author.email) && (
        <div className="mt-3 flex items-center gap-3">
          {author.linkedin && (
            <a href={author.linkedin} target="_blank" rel="noopener noreferrer"
              className="text-[11.5px] text-mute hover:text-navy transition-colors lz-linkline">
              LinkedIn
            </a>
          )}
          {author.email && (
            <a href={`mailto:${author.email}`}
              className="text-[11.5px] text-mute hover:text-navy transition-colors lz-linkline">
              {lang === "ar" ? "البريد" : "Email"}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function SidebarPubCard({ pub, lang }) {
  const title = pub[`title_${lang}`] || pub.title_en || pub.title_ar || "";
  const slug  = pub[`slug_${lang}`]  || pub.slug_en  || pub.slug_ar  || pub.id;
  const type  = TYPE_LABELS[lang]?.[pub.publication_type] || pub.publication_type || "";

  return (
    <Link to={`/publications/${slug}`}
      className="group flex items-start gap-3"
      style={{ borderBottom: "1px solid rgba(28,37,51,0.07)", paddingBottom: 12 }}>
      {/* Cover image */}
      {pub.cover_image_url ? (
        <img src={pub.cover_image_url} alt={title}
          className="w-14 h-[72px] object-cover shrink-0"
          style={{ border: "1px solid rgba(28,37,51,0.08)" }} />
      ) : (
        <div className="w-14 h-[72px] shrink-0 flex items-center justify-center"
          style={{ background: "var(--tb-navy-900,#0A111C)", opacity: 0.85 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(251,250,247,0.5)" }} className="uppercase px-1 text-center">
            {type}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        {type && (
          <div style={{ fontSize: 10, letterSpacing: lang === "ar" ? "0.02em" : "0.14em", color: "rgba(28,37,51,0.4)" }} className="uppercase mb-1">
            {type}
          </div>
        )}
        <div className="text-[13px] text-navy-deep leading-[1.5] group-hover:text-brass transition-colors line-clamp-3"
          style={{ fontFamily: '"Thmanyah Serif Display", serif' }}>
          {title}
        </div>
      </div>
    </Link>
  );
}

function PubNavArrow({ pub, lang, side, visible }) {
  const [hovered, setHovered] = useState(false);
  if (!pub) return null;
  // hooks above — safe to use now
  const title = pub[`title_${lang}`] || pub.title_en || pub.title_ar || "";
  const slug  = pub[`slug_${lang}`]  || pub.slug_en  || pub.slug_ar  || pub.id;
  const isLeft = side === "prev";

  return (
    <Link
      to={`/publications/${slug}`}
      data-testid={`pub-nav-${side}`}
      className="hidden lg:flex fixed top-1/2 -translate-y-1/2 z-30 items-center gap-1.5"
      style={{
        [isLeft ? "left" : "right"]: 10,
        flexDirection: isLeft ? "row" : "row-reverse",
        color: "var(--tb-gold, #B08C5A)",
        textDecoration: "none",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.4s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Arrow — bounces outward on hover */}
      <div style={{
        transform: hovered
          ? `translateX(${isLeft ? "-5px" : "5px"}) scale(1.15)`
          : "translateX(0) scale(1)",
        opacity: hovered ? 1 : 0.55,
        transition: "transform 0.25s ease, opacity 0.2s ease",
      }}>
        {isLeft ? <ChevronLeft size={24} strokeWidth={1.4} /> : <ChevronRight size={24} strokeWidth={1.4} />}
      </div>

      {/* Vertical title — slides in on hover */}
      <div style={{
        writingMode: "vertical-rl",
        textOrientation: "mixed",
        fontSize: hovered ? 13.5 : 0,
        letterSpacing: "0.07em",
        lineHeight: 1.6,
        fontFamily: '"Thmanyah Serif Display", serif',
        transform: isLeft ? "rotate(180deg)" : "none",
        whiteSpace: "nowrap",
        maxHeight: hovered ? 180 : 0,
        overflow: "hidden",
        opacity: hovered ? 0.9 : 0,
        transition: "max-height 0.35s ease, opacity 0.3s ease, font-size 0.25s ease",
      }}>
        {title.length > 38 ? title.slice(0, 38) + "…" : title}
      </div>
    </Link>
  );
}

function AuthorCard({ author, lang }) {
  const name  = author[`name_${lang}`]  || author.name_en  || author.name_ar  || "";
  const title = author[`title_${lang}`] || author.title_en || author.title_ar || "";
  const bio   = author[`bio_${lang}`]   || author.bio_en   || author.bio_ar   || "";

  return (
    <div className="flex items-start gap-5 p-5 bg-white border border-rule" data-testid={`author-card-${author.id}`}>
      {/* Photo */}
      {author.photo_url ? (
        <img
          src={author.photo_url}
          alt={name}
          className="w-16 h-16 object-cover shrink-0"
          style={{ border: "1px solid rgba(28,37,51,0.1)" }}
        />
      ) : (
        <div
          className="w-16 h-16 shrink-0 flex items-center justify-center"
          style={{ background: "var(--tb-navy-900, #0A111C)", color: "rgba(251,250,247,0.6)", fontFamily: '"Thmanyah Serif Display", serif', fontSize: 22 }}
        >
          {name.charAt(0)}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[15.5px] font-medium text-navy-deep" style={{ fontFamily: '"Thmanyah Serif Display", serif' }}>
          {name}
        </div>
        {title && (
          <div className="mt-0.5 text-[12.5px] uppercase tracking-[0.12em] text-brass">{title}</div>
        )}
        {bio && (
          <p className="mt-2 text-[13.5px] text-ink/70 leading-[1.75]">{bio}</p>
        )}
        {/* Links */}
        {(author.linkedin || author.email) && (
          <div className="mt-3 flex items-center gap-4">
            {author.linkedin && (
              <a href={author.linkedin} target="_blank" rel="noopener noreferrer"
                className="text-[12px] text-mute hover:text-navy transition-colors lz-linkline">
                LinkedIn
              </a>
            )}
            {author.email && (
              <a href={`mailto:${author.email}`}
                className="text-[12px] text-mute hover:text-navy transition-colors lz-linkline">
                {author.email}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleBody({ gated, gatedReason, html, lang, isAuthed, registrationEnabled, onLogin }) {
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

function ResponsesTab({ lang, slug, isAuthed, responsesEnabled, userName, userEmail }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", body: "", author_name: userName || "", author_email: userEmail || "", consent: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/public/publications/${slug}/responses`)
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [slug]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.consent) {
      setError(lang === "ar" ? "يرجى الموافقة على شروط النشر." : "Please agree to the publication terms.");
      return;
    }
    if (form.title.length < 3 || form.body.length < 10) {
      setError(lang === "ar" ? "العنوان والنص مطلوبان (بطول كافٍ)." : "Title and body are required (sufficient length).");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/public/publications/${slug}/responses`, form);
      setSuccess(true);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-10" data-testid="responses-tab">
      {/* Approved responses */}
      <div>
        <div className="lz-eyebrow text-navy/70">
          {lang === "ar" ? "الردود المنشورة" : "Published responses"}
        </div>
        <div className="mt-3 h-px w-10 bg-brass" />
        {loading ? <div className="mt-6 text-mute text-[14px]">Loading…</div>
          : items.length === 0 ? (
            <p className="mt-5 text-[14.5px] text-mute max-w-[58ch]">
              {lang === "ar"
                ? "لا توجد ردود منشورة بعد. كن أول من يساهم بوجهة نظر علمية."
                : "No published responses yet. Be the first to contribute a scholarly viewpoint."}
            </p>
          ) : (
            <ul className="mt-6 space-y-6" data-testid="responses-list">
              {items.map((r) => (
                <li key={r.id} className="bg-white border border-rule p-6" data-testid={`response-${r.id}`}>
                  <div className="text-[11.5px] uppercase tracking-[0.18em] text-brass font-semibold">
                    {r.author_name}
                  </div>
                  <h4 className="text-[18px] font-medium text-navy-deep mt-2">{r.title}</h4>
                  <div className="mt-3 text-[14.5px] leading-[1.9] text-ink/85 prose prose-sm max-w-none"
                       dangerouslySetInnerHTML={{ __html: r.body_html }} />
                  <div className="mt-4 text-[11.5px] text-mute tabular-nums">
                    {(r.approved_at || r.submitted_at || "").slice(0, 10)}
                  </div>
                </li>
              ))}
            </ul>
          )}
      </div>

      {/* Submission form */}
      {!responsesEnabled ? (
        <div className="bg-paper border border-rule p-6 text-[13.5px] text-mute">
          {lang === "ar"
            ? "استقبال الردود معطّل لهذه الدراسة."
            : "Response submissions are disabled for this publication."}
        </div>
      ) : success ? (
        <div className="bg-white border border-rule p-8 text-center" data-testid="response-success">
          <div className="lz-eyebrow text-brass">
            {lang === "ar" ? "تم الاستلام" : "Submitted"}
          </div>
          <div className="mt-3 h-px w-10 bg-brass mx-auto" />
          <h3 className="text-[20px] font-medium text-navy-deep mt-6">
            {lang === "ar" ? "شكراً لمساهمتك العلمية." : "Thank you for your scholarly contribution."}
          </h3>
          <p className="mt-3 text-[14px] text-mute max-w-[55ch] mx-auto">
            {lang === "ar"
              ? "سيقوم فريق المركز بمراجعة ردك، وسيُنشر على هذه الصفحة عند اعتماده."
              : "Our editorial team will review your response. It will appear on this page after approval."}
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="bg-white border border-rule p-7 md:p-8 space-y-4" data-testid="response-form">
          <div className="lz-eyebrow text-navy/70">
            {lang === "ar" ? "إرسال رد علمي" : "Submit a scholarly response"}
          </div>
          <div className="h-px w-10 bg-brass" />

          <label className="block">
            <span className="block text-[12.5px] uppercase tracking-[0.14em] text-mute mb-1.5">
              {lang === "ar" ? "عنوان الرد" : "Response title"}
            </span>
            <input required minLength={3} maxLength={240} value={form.title}
                   onChange={(e) => setForm({ ...form, title: e.target.value })}
                   className="w-full h-11 px-3 border border-rule focus:border-navy outline-none text-[15px]"
                   data-testid="response-title" />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-[12.5px] uppercase tracking-[0.14em] text-mute mb-1.5">
                {lang === "ar" ? "الاسم" : "Name"}
              </span>
              <input required value={form.author_name}
                     onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                     className="w-full h-11 px-3 border border-rule focus:border-navy outline-none text-[15px]"
                     data-testid="response-author-name" />
            </label>
            <label className="block">
              <span className="block text-[12.5px] uppercase tracking-[0.14em] text-mute mb-1.5">
                {lang === "ar" ? "البريد الإلكتروني" : "Email"}
              </span>
              <input type="email" required value={form.author_email}
                     onChange={(e) => setForm({ ...form, author_email: e.target.value })}
                     className="w-full h-11 px-3 border border-rule focus:border-navy outline-none text-[15px]"
                     data-testid="response-author-email" />
            </label>
          </div>

          <label className="block">
            <span className="block text-[12.5px] uppercase tracking-[0.14em] text-mute mb-1.5">
              {lang === "ar" ? "نص الرد" : "Response body"}
            </span>
            <textarea required minLength={10} maxLength={15000} rows={8} value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      className="w-full px-3 py-2.5 border border-rule focus:border-navy outline-none text-[15px] leading-[1.8] resize-y"
                      data-testid="response-body" />
          </label>

          <label className="flex items-start gap-2 text-[13px] text-ink/80 cursor-pointer">
            <input type="checkbox" checked={form.consent}
                   onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                   className="mt-1" data-testid="response-consent" />
            <span>
              {lang === "ar"
                ? "أوافق على مراجعة فريق المركز لردي ونشره علنياً عند اعتماده."
                : "I agree to editorial review and public publication of my response upon approval."}
            </span>
          </label>

          {error && (
            <div className="text-[13px] text-[#9E3B3B] border-l-2 border-[#9E3B3B] ps-3" data-testid="response-error">{error}</div>
          )}

          <button type="submit" disabled={submitting}
                  className="lz-btn-primary inline-flex disabled:opacity-60"
                  data-testid="response-submit">
            {submitting
              ? (lang === "ar" ? "جارٍ الإرسال…" : "Sending…")
              : (lang === "ar" ? "إرسال الرد" : "Submit response")}
          </button>

          {!isAuthed && (
            <p className="text-[12px] text-mute">
              {lang === "ar"
                ? "الأعضاء المسجلون يمكنهم إرسال الردود بعد تسجيل الدخول أيضاً."
                : "Registered members can also submit responses after signing in."}
            </p>
          )}
        </form>
      )}
    </div>
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

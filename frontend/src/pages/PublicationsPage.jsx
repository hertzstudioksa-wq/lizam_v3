import { useEffect, useRef, useState } from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import PublicationCard from "@/components/publications/PublicationCard";
import HeroMediaLayer from "@/components/hero/HeroMediaLayer";
import { useLang } from "@/i18n/LanguageContext";
import { usePublications, useCategories, useAuthors } from "@/hooks/usePublications";
import { usePublicationsPageContent } from "@/hooks/useSiteSettings";

const TYPES = [
  { value: "", ar: "جميع الأنواع", en: "All types" },
  { value: "study", ar: "دراسة", en: "Study" },
  { value: "research", ar: "بحث", en: "Research" },
  { value: "policy_paper", ar: "ورقة سياسات", en: "Policy Paper" },
  { value: "report", ar: "تقرير", en: "Report" },
];

const SORTS = [
  { value: "latest", ar: "الأحدث", en: "Latest" },
  { value: "oldest", ar: "الأقدم", en: "Oldest" },
  { value: "most_viewed", ar: "الأكثر قراءة", en: "Most viewed" },
];

export default function PublicationsPage() {
  const { lang, t } = useLang();
  const { data: pc } = usePublicationsPageContent();
  const p = (ar, en) => pc?.[`${ar}_${lang}`] || (lang === "ar" ? ar.replace(/_ar$/, "") : en);

  // Page content with DB overrides
  const heroEyebrow        = pc?.[`hero_eyebrow_${lang}`]        || (lang === "ar" ? "مكتبة المركز" : "Library");
  const heroTitle          = pc?.[`hero_title_${lang}`]          || (lang === "ar" ? "الإصدارات البحثية" : "Research Publications");
  const heroSubtitle       = pc?.[`hero_subtitle_${lang}`]       || "";
  const countSuffix        = pc?.[`count_suffix_${lang}`]        || (lang === "ar" ? "إصدار منشور" : "published items");
  const searchPlaceholder  = pc?.[`search_placeholder_${lang}`]  || (lang === "ar" ? "ابحث في الإصدارات…" : "Search publications…");
  const allFieldsLabel     = pc?.[`all_fields_label_${lang}`]    || (lang === "ar" ? "كل المجالات" : "All fields");
  const clearFiltersLabel  = pc?.[`clear_filters_${lang}`]       || (lang === "ar" ? "مسح الفلاتر" : "Reset");
  const emptyEyebrow       = pc?.[`empty_eyebrow_${lang}`]       || (lang === "ar" ? "لا توجد نتائج" : "No results");
  const emptyTitle         = pc?.[`empty_title_${lang}`]         || (lang === "ar" ? "لم نعثر على إصدارات تطابق المعايير." : "No publications match the current filters.");
  const emptyReset         = pc?.[`empty_reset_${lang}`]         || (lang === "ar" ? "إعادة تعيين الفلاتر" : "Reset filters");

  // Section ordering — derived from visible_sections saved by admin
  const DEFAULT_PUB_SECTIONS = ["authors_section", "results"];
  const pubSectionOrder = (Array.isArray(pc?.visible_sections) && pc.visible_sections.length > 0)
    ? pc.visible_sections
    : DEFAULT_PUB_SECTIONS;

  const authorsVisible    = pc?.authors_section_visible !== false && pubSectionOrder.includes("authors_section");
  const authorsHeading    = pc?.[`authors_heading_${lang}`]    || (lang === "ar" ? "باحثو المركز" : "Our Researchers");
  const authorsSubheading = pc?.[`authors_subheading_${lang}`] || (lang === "ar"
    ? "يُعلي باحثو مركز لزام من قيمة البحث القانوني، خدمةً للمملكة العربية السعودية وإسهاماً في بناء منظومة تشريعية راسخة."
    : "LIZAM researchers elevate the value of legal scholarship, serving Saudi Arabia and contributing to a principled legislative foundation.");

  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [pubType, setPubType] = useState("");
  const [sort, setSort] = useState("latest");
  const [selectedAuthor, setSelectedAuthor] = useState(null);

  const categories = useCategories();
  const authors = useAuthors();
  const { data, loading } = usePublications({
    q: qDebounced || undefined,
    category: category || undefined,
    pubType: pubType || undefined,
    sort,
    limit: 24,
    authorId: selectedAuthor?.id || undefined,
  });

  const items = data?.items || [];
  const total = data?.total || 0;

  // Debounce search
  useDebounce(() => setQDebounced(q), 350, [q]);

  const clearFilters = () => {
    setQ("");
    setQDebounced("");
    setCategory("");
    setPubType("");
    setSort("latest");
    setSelectedAuthor(null);
  };
  const hasFilters = q || category || pubType || sort !== "latest" || selectedAuthor;

  return (
    <PublicLayout>
      {/* Masthead — cinematic hero band (image background + dark overlay) */}
      <section
        className="relative isolate pt-[130px] md:pt-[150px] pb-14 md:pb-16 min-h-[46vh] md:min-h-[50vh] overflow-hidden"
        data-testid="publications-masthead"
        style={{ background: "var(--tb-navy-900, #0A111C)", color: "var(--tb-paper-base, #FBFAF7)" }}
      >
        <HeroMediaLayer pageKey="publications" extendBehindHeader />
        <div className="relative z-10 mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14">
          <div className="lz-eyebrow" style={{ color: "var(--tb-gold, #B4914A)" }}>
            {heroEyebrow}
          </div>
          <div className="mt-3 h-px w-12" style={{ background: "var(--tb-gold, #B4914A)" }} />
          <div className="mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="lz-display max-w-[22ch]" style={{ color: "var(--tb-paper-base, #FBFAF7)" }}>
                {heroTitle}
              </h1>
              {heroSubtitle && (
                <p className="mt-3 max-w-[56ch]" style={{ color: "rgba(251,250,247,0.75)", fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                  {heroSubtitle}
                </p>
              )}
            </div>
            <p className="text-[13.5px] uppercase tracking-[0.18em] tabular-nums shrink-0" style={{ color: "rgba(251,250,247,0.72)" }}>
              {total} {countSuffix}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14">
        <div className="lz-hairline" />
      </div>

      {/* Filters bar — always sticky right below hero */}
      <section className="bg-ivory sticky top-[70px] md:top-[78px] z-20 border-b border-rule" data-testid="publications-filters">
        <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search size={16} strokeWidth={1.5} className="absolute top-1/2 -translate-y-1/2 start-3 text-mute pointer-events-none" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-11 ps-10 pe-10 bg-white border border-rule focus:border-navy outline-none text-[14.5px]"
                data-testid="publications-search" />
              {q && (
                <button type="button" onClick={() => setQ("")}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-mute hover:text-navy" aria-label="Clear">
                  <X size={14} />
                </button>
              )}
            </div>
            <FilterSelect value={category} onChange={setCategory}
              options={[{ value: "", label: allFieldsLabel }, ...categories.map((c) => ({ value: c.id, label: c[`title_${lang}`] }))]}
              testid="filter-category" />
            <FilterSelect value={pubType} onChange={setPubType}
              options={TYPES.map((t) => ({ value: t.value, label: t[lang] }))} testid="filter-type" />
            <FilterSelect value={sort} onChange={setSort}
              options={SORTS.map((s) => ({ value: s.value, label: s[lang] }))} testid="filter-sort" />
            {hasFilters && (
              <button type="button" onClick={clearFilters}
                className="text-[13px] text-navy hover:text-brass transition-colors lz-linkline shrink-0"
                data-testid="clear-filters">
                {clearFiltersLabel}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Authors carousel + Results — ordered by admin */}
      {pubSectionOrder.filter(k => k !== "hero" && k !== "content").map((key) => {
        if (key === "authors_section") {
          return authorsVisible && authors.length > 0 ? (
            <AuthorsCarousel
              key="authors_section"
              authors={authors} lang={lang}
              selected={selectedAuthor}
              onSelect={(a) => setSelectedAuthor(prev => prev?.id === a.id ? null : a)}
              heading={authorsHeading} subheading={authorsSubheading}
            />
          ) : null;
        }
        if (key === "results") {
          return (
            <section key="results" className="bg-paper min-h-[50vh]" data-testid="publications-results">
              <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 py-14 md:py-20">
                {loading ? (
                  <div className="text-center text-mute py-20" data-testid="publications-loading">{t("common.loading")}</div>
                ) : items.length === 0 ? (
                  <EmptyState hasFilters={hasFilters} onClear={clearFilters}
                    eyebrow={emptyEyebrow} title={emptyTitle} resetLabel={emptyReset} />
                ) : (
                  <>
                    <style>{`@keyframes pubGridIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7"
                      data-testid="publications-grid" style={{ animation: "pubGridIn 0.35s ease" }}>
                      {items.map((pub) => (
                        <PublicationCard key={pub.id} pub={pub} testid={`pub-${pub.id}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>
          );
        }
        return null;
      })}
    </PublicLayout>
  );
}

function FilterSelect({ value, onChange, options, testid }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 px-3 bg-white border border-rule focus:border-navy outline-none text-[13.5px] min-w-[150px]"
      data-testid={testid}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/* ── Authors Carousel ── */
const CARD_W = 180; // px per card

function AuthorsCarousel({ authors, lang, selected, onSelect, heading, subheading }) {
  const containerRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [containerW, setContainerW] = useState(1000);
  const [hovered, setHovered] = useState(null); // id of hovered card
  const isRtl = lang === "ar";

  useEffect(() => {
    function measure() {
      if (containerRef.current) setContainerW(containerRef.current.clientWidth);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const GAP = 16;
  const visibleCount = Math.max(1, Math.floor((containerW + GAP) / (CARD_W + GAP)));
  const maxOffset = Math.max(0, authors.length - visibleCount);

  // clamp offset when window resizes
  useEffect(() => {
    setOffset(prev => Math.min(prev, maxOffset));
  }, [maxOffset]);

  function prev() { setOffset(o => Math.max(0, o - 1)); }
  function next() { setOffset(o => Math.min(maxOffset, o + 1)); }

  const canPrev = offset > 0;
  const canNext = offset < maxOffset;

  // translate direction depends on RTL
  const translateX = isRtl
    ? `${offset * (CARD_W + GAP)}px`
    : `-${offset * (CARD_W + GAP)}px`;

  return (
    <section className="bg-paper border-b border-rule py-10" data-testid="authors-carousel">
      <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14" style={{ direction: isRtl ? "rtl" : "ltr" }}>

        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-2">
            <span style={{ height: 1, width: 20, background: "var(--tb-gold, #B4914A)", flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "var(--tb-gold, #B4914A)" }} className="uppercase">
              {heading}
            </span>
          </div>
          {subheading && (
            <p style={{ fontSize: 14, color: "rgba(28,37,51,0.6)", lineHeight: 1.75, maxWidth: "68ch", fontFamily: '"Thmanyah Serif Text", serif', whiteSpace: "pre-line" }}>
              {subheading}
            </p>
          )}
        </div>

        {/* Carousel wrapper — padding for arrows, fade on edges */}
        <div className="relative px-10">

          {/* ── Arrow START (right in RTL, left in LTR) ── */}
          <button
            onClick={isRtl ? next : prev}
            aria-label="previous"
            className="absolute top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center transition-all duration-200"
            style={{
              [isRtl ? "right" : "left"]: 0,
              color: (isRtl ? canNext : canPrev)
                ? "var(--tb-gold, #B4914A)"
                : "rgba(28,37,51,0.2)",
              cursor: (isRtl ? canNext : canPrev) ? "pointer" : "default",
            }}
          >
            {isRtl ? <ChevronRight size={22} strokeWidth={1.6} /> : <ChevronLeft size={22} strokeWidth={1.6} />}
          </button>

          {/* ── Arrow END (left in RTL, right in LTR) ── */}
          <button
            onClick={isRtl ? prev : next}
            aria-label="next"
            className="absolute top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center transition-all duration-200"
            style={{
              [isRtl ? "left" : "right"]: 0,
              color: (isRtl ? canPrev : canNext)
                ? "var(--tb-gold, #B4914A)"
                : "rgba(28,37,51,0.2)",
              cursor: (isRtl ? canPrev : canNext) ? "pointer" : "default",
            }}
          >
            {isRtl ? <ChevronLeft size={22} strokeWidth={1.6} /> : <ChevronRight size={22} strokeWidth={1.6} />}
          </button>

          {/* overflow-x only — vertical space for scale without clipping */}
          <div className="overflow-x-hidden py-4 -my-4" ref={containerRef}>
            <div
              className="flex"
              style={{
                gap: GAP,
                transform: `translateX(${translateX})`,
                transition: "transform 0.45s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              {authors.map((a) => {
                const name    = a[`name_${lang}`]  || a.name_en  || a.name_ar  || "";
                const title   = a[`title_${lang}`] || a.title_en || a.title_ar || "";
                const isActive  = selected?.id === a.id;
                const isHovered = hovered === a.id;
                // Dim cards that are not focused (hover or selected active)
                const isFocused = isActive || isHovered;
                const anyFocused = selected !== null || hovered !== null;
                const opacity = anyFocused && !isFocused ? 0.45 : 1;

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onSelect(a)}
                    onMouseEnter={() => setHovered(a.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="shrink-0 text-center"
                    style={{
                      width: CARD_W,
                      opacity,
                      transform: isActive
                        ? "scale(1.06) translateY(-5px)"
                        : isHovered
                          ? "scale(1.04) translateY(-3px)"
                          : "scale(1) translateY(0)",
                      transition: "opacity 0.3s ease, transform 0.3s ease",
                    }}
                    data-testid={`author-card-${a.id}`}
                  >
                    {/* Photo — no inner scale to avoid clipping */}
                    <div
                      style={{
                        width: CARD_W, height: CARD_W,
                        overflow: "hidden",
                        border: isActive
                          ? "2px solid var(--tb-gold,#B4914A)"
                          : isHovered
                            ? "2px solid rgba(176,140,90,0.45)"
                            : "2px solid rgba(28,37,51,0.08)",
                        boxShadow: isActive
                          ? "0 12px 32px rgba(10,17,28,0.18)"
                          : isHovered
                            ? "0 6px 20px rgba(10,17,28,0.1)"
                            : "none",
                        transition: "border-color 0.25s, box-shadow 0.25s",
                      }}
                    >
                      {a.photo_url ? (
                        <img src={a.photo_url} alt={name}
                          className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            background: isActive ? "var(--tb-gold,#B4914A)" : "#EDEAE4",
                            color: isActive ? "rgba(255,255,255,0.95)" : "rgba(28,37,51,0.4)",
                            fontFamily: '"Thmanyah Serif Display", serif',
                            fontSize: 40,
                            transition: "background 0.25s, color 0.25s",
                          }}
                        >
                          {name.charAt(0)}
                        </div>
                      )}
                    </div>
                    {/* Name & title */}
                    <div className="mt-2.5">
                      <div style={{
                        fontSize: 13.5, fontFamily: '"Thmanyah Serif Display", serif',
                        lineHeight: 1.35,
                        color: isActive
                          ? "var(--tb-gold,#B4914A)"
                          : isHovered
                            ? "var(--tb-navy-deep,#0A111C)"
                            : "var(--tb-navy-deep,#0A111C)",
                        transition: "color 0.2s",
                      }}>
                        {name}
                      </div>
                      {title && (
                        <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(28,37,51,0.45)", marginTop: 3 }}
                          className="uppercase">
                          {title}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected author active banner */}
        {selected && (
          <div className="mt-6 flex items-center gap-3 px-4 py-2.5"
            style={{
              background: "rgba(180,148,74,0.07)",
              borderInlineStart: "3px solid var(--tb-gold,#B4914A)",
              animation: "fadeInDown 0.3s ease",
            }}>
            <span style={{ fontSize: 13, color: "var(--tb-navy-deep,#0A111C)" }}>
              {isRtl
                ? `عرض إصدارات: ${selected[`name_ar`] || selected.name_en}`
                : `Showing: ${selected[`name_en`] || selected.name_ar}`}
            </span>
            <button onClick={() => onSelect(selected)} className="ms-auto text-mute hover:text-navy transition-colors">
              <X size={13} />
            </button>
          </div>
        )}

        <style>{`
          @keyframes fadeInDown{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        `}</style>
      </div>
    </section>
  );
}

function EmptyState({ hasFilters, onClear, eyebrow, title, resetLabel }) {
  return (
    <div className="text-center py-20 border border-rule bg-white" data-testid="publications-empty">
      <div className="lz-eyebrow text-mute">{eyebrow}</div>
      <h2 className="lz-h3 mt-4">{title}</h2>
      {hasFilters && (
        <button onClick={onClear} className="lz-btn-ghost mt-6" data-testid="empty-clear">
          {resetLabel}
        </button>
      )}
    </div>
  );
}

// Lightweight debounce hook
function useDebounce(fn, ms, deps) {
  useEffect(() => {
    const t = setTimeout(fn, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

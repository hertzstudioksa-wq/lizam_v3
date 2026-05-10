import { useState } from "react";
import { Search, X } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import PublicationCard from "@/components/publications/PublicationCard";
import HeroMediaLayer from "@/components/hero/HeroMediaLayer";
import { useLang } from "@/i18n/LanguageContext";
import { usePublications, useCategories } from "@/hooks/usePublications";

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
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [pubType, setPubType] = useState("");
  const [sort, setSort] = useState("latest");

  const categories = useCategories();
  const { data, loading } = usePublications({
    q: qDebounced || undefined,
    category: category || undefined,
    pubType: pubType || undefined,
    sort,
    limit: 24,
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
  };
  const hasFilters = q || category || pubType || sort !== "latest";

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
            {lang === "ar" ? "مكتبة المركز" : "Library"}
          </div>
          <div className="mt-3 h-px w-12" style={{ background: "var(--tb-gold, #B4914A)" }} />
          <div className="mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <h1 className="lz-display max-w-[22ch]" style={{ color: "var(--tb-paper-base, #FBFAF7)" }}>
              {lang === "ar" ? "الإصدارات البحثية" : "Research Publications"}
            </h1>
            <p className="text-[13.5px] uppercase tracking-[0.18em] tabular-nums" style={{ color: "rgba(251,250,247,0.72)" }}>
              {total} {lang === "ar" ? "إصدار منشور" : "published items"}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14">
        <div className="lz-hairline" />
      </div>

      {/* Filters bar */}
      <section className="bg-ivory sticky top-[70px] md:top-[78px] z-20 border-b border-rule" data-testid="publications-filters">
        <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search size={16} strokeWidth={1.5} className="absolute top-1/2 -translate-y-1/2 start-3 text-mute pointer-events-none" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={lang === "ar" ? "ابحث في الإصدارات…" : "Search publications…"}
                className="w-full h-11 ps-10 pe-10 bg-white border border-rule focus:border-navy outline-none text-[14.5px]"
                data-testid="publications-search"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-mute hover:text-navy"
                  aria-label="Clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category */}
            <FilterSelect
              value={category} onChange={setCategory}
              options={[
                { value: "", label: lang === "ar" ? "كل المجالات" : "All fields" },
                ...categories.map((c) => ({ value: c.id, label: c[`title_${lang}`] })),
              ]}
              testid="filter-category"
            />
            {/* Type */}
            <FilterSelect
              value={pubType} onChange={setPubType}
              options={TYPES.map((t) => ({ value: t.value, label: t[lang] }))}
              testid="filter-type"
            />
            {/* Sort */}
            <FilterSelect
              value={sort} onChange={setSort}
              options={SORTS.map((s) => ({ value: s.value, label: s[lang] }))}
              testid="filter-sort"
            />

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[13px] text-navy hover:text-brass transition-colors lz-linkline shrink-0"
                data-testid="clear-filters"
              >
                {lang === "ar" ? "مسح الفلاتر" : "Reset"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="bg-paper min-h-[50vh]" data-testid="publications-results">
        <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 py-14 md:py-20">
          {loading ? (
            <div className="text-center text-mute py-20" data-testid="publications-loading">
              {t("common.loading")}
            </div>
          ) : items.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onClear={clearFilters} lang={lang} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7" data-testid="publications-grid">
              {items.map((pub) => (
                <PublicationCard key={pub.id} pub={pub} testid={`pub-${pub.id}`} />
              ))}
            </div>
          )}
        </div>
      </section>
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

function EmptyState({ hasFilters, onClear, lang }) {
  return (
    <div className="text-center py-20 border border-rule bg-white" data-testid="publications-empty">
      <div className="lz-eyebrow text-mute">{lang === "ar" ? "لا توجد نتائج" : "No results"}</div>
      <h2 className="lz-h3 mt-4">
        {lang === "ar" ? "لم نعثر على إصدارات تطابق المعايير." : "No publications match the current filters."}
      </h2>
      {hasFilters && (
        <button onClick={onClear} className="lz-btn-ghost mt-6" data-testid="empty-clear">
          {lang === "ar" ? "إعادة تعيين الفلاتر" : "Reset filters"}
        </button>
      )}
    </div>
  );
}

// Lightweight debounce hook
import { useEffect } from "react";
function useDebounce(fn, ms, deps) {
  useEffect(() => {
    const t = setTimeout(fn, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import { useLang } from "@/i18n/LanguageContext";
import { usePublications, useCategories } from "@/hooks/usePublications";

const TYPES = [
  { value: "", ar: "كل الأنواع", en: "All types" },
  { value: "study", ar: "دراسة", en: "Study" },
  { value: "research", ar: "بحث", en: "Research" },
  { value: "policy_paper", ar: "ورقة سياسات", en: "Policy paper" },
  { value: "report", ar: "تقرير", en: "Report" },
];
const SORTS = [
  { value: "latest", ar: "الأحدث", en: "Latest" },
  { value: "oldest", ar: "الأقدم", en: "Oldest" },
  { value: "most_viewed", ar: "الأكثر قراءة", en: "Most viewed" },
];

const FALLBACK_COVER = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400";

export default function PublicationsListingC() {
  const { lang } = useLang();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [pubType, setPubType] = useState("");
  const [sort, setSort] = useState("latest");
  const cats = useCategories() || [];
  const { data, loading } = usePublications({
    q: q || undefined,
    category: category || undefined,
    pubType: pubType || undefined,
    sort,
    limit: 24,
  });
  const items = data?.items || [];
  const total = data?.total || 0;

  const slugFor = (p) => p.slug_ar || p.slug_en || p.id;
  const titleOf = (p) => (lang === "ar" ? p.title_ar : p.title_en) || p.title_ar || p.title_en;
  const summaryOf = (p) => (lang === "ar" ? p.summary_ar : p.summary_en) || "";

  const lead = items[0];
  const second = items[1];
  const rest = items.slice(2);
  const hasFilters = q || category || pubType || sort !== "latest";

  return (
    <PublicLayout>
      {/* Masthead */}
      <section className="pt-[120px] md:pt-[140px] pb-12" style={{ background: "var(--tc-ivory)" }} data-testid="publications-masthead">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14">
          <div className="tc-overline">{lang === "ar" ? "مكتبة المركز" : "Editorial Index"}</div>
          <h1
            className="mt-5 text-[40px] md:text-[56px] lg:text-[68px] leading-[1.1] font-semibold"
            style={{ color: "var(--tc-navy)", fontFamily: lang === "ar" ? 'var(--lz-font-ar, "Thmanyah Serif Display"), serif' : '"Source Serif 4", serif' }}
            data-testid="publications-title"
          >
            {lang === "ar" ? "كل الإصدارات" : "All publications"}
          </h1>
          <div className="mt-6 flex items-center gap-3">
            <span className="tc-rule-gold" />
            <span className="text-[12.5px] tabular-nums tracking-[0.12em] uppercase" style={{ color: "var(--tc-text-muted)" }}>
              {total} {lang === "ar" ? "إصدار" : "items"}
            </span>
          </div>
        </div>
      </section>

      {/* Sticky filters */}
      <section className="sticky top-[68px] md:top-[78px] z-30 border-y" style={{ background: "var(--tc-ivory)", borderColor: "var(--tc-rule)" }}>
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14 py-3 flex items-center gap-6 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Search size={14} style={{ color: "var(--tc-text-muted)" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "ar" ? "بحث…" : "Search…"}
              className="tc-field-light w-44"
              data-testid="search-input"
            />
          </div>
          <span className="block w-px h-5 shrink-0" style={{ background: "var(--tc-rule)" }} />
          <div className="flex items-center gap-5 shrink-0">
            <button onClick={() => setPubType("")} className={`tc-filter-link ${pubType === "" ? "active" : ""}`}>{lang === "ar" ? "كل الأنواع" : "All"}</button>
            {TYPES.slice(1).map((tp) => (
              <button key={tp.value} onClick={() => setPubType(tp.value)} className={`tc-filter-link ${pubType === tp.value ? "active" : ""}`} data-testid={`type-${tp.value}`}>
                {lang === "ar" ? tp.ar : tp.en}
              </button>
            ))}
          </div>
          {cats.length > 0 && (
            <>
              <span className="block w-px h-5 shrink-0" style={{ background: "var(--tc-rule)" }} />
              <div className="flex items-center gap-5 shrink-0">
                <button onClick={() => setCategory("")} className={`tc-filter-link ${!category ? "active" : ""}`}>
                  {lang === "ar" ? "كل المجالات" : "All fields"}
                </button>
                {cats.slice(0, 5).map((c) => (
                  <button key={c.id} onClick={() => setCategory(c.id)} className={`tc-filter-link ${category === c.id ? "active" : ""}`}>
                    {lang === "ar" ? c.title_ar : c.title_en}
                  </button>
                ))}
              </div>
            </>
          )}
          <span className="ms-auto shrink-0 flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--tc-text-muted)" }}>{lang === "ar" ? "ترتيب" : "Sort"}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="tc-field-light w-auto" data-testid="sort-select">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{lang === "ar" ? s.ar : s.en}</option>)}
            </select>
            {hasFilters && (
              <button onClick={() => { setQ(""); setCategory(""); setPubType(""); setSort("latest"); }} className="text-[12px] inline-flex items-center gap-1" style={{ color: "var(--tc-gold)" }} data-testid="clear-filters">
                <X size={12} /> {lang === "ar" ? "مسح" : "Clear"}
              </button>
            )}
          </span>
        </div>
      </section>

      <section className="py-16 md:py-24" style={{ background: "var(--tc-ivory)" }}>
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14">
          {loading ? (
            <div className="text-center py-24" style={{ color: "var(--tc-text-muted)" }}>{lang === "ar" ? "جارٍ التحميل…" : "Loading…"}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-24" style={{ color: "var(--tc-text-muted)" }}>{lang === "ar" ? "لا توجد نتائج." : "No results."}</div>
          ) : (
            <>
              {/* First two items: full-width horizontal bands */}
              {[lead, second].filter(Boolean).map((p, idx) => (
                <Link
                  key={p.id}
                  to={`/publications/${slugFor(p)}`}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 group ${idx === 0 ? "mb-20" : "mb-20"} ${idx === 1 && lang !== "ar" ? "" : ""}`}
                  data-testid={`pub-band-${p.id}`}
                >
                  <div className={`lg:col-span-7 ${idx === 1 ? "lg:order-2" : ""}`}>
                    <div className="relative w-full aspect-[16/10] overflow-hidden" style={{ background: "var(--tc-ivory-dark)" }}>
                      <img src={p.cover_image_url || FALLBACK_COVER} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                    </div>
                  </div>
                  <div className={`lg:col-span-5 self-center ${idx === 1 ? "lg:order-1" : ""}`}>
                    <div className="tc-overline">{p.publication_type?.replace("_", " ")} · {(p.published_at || p.created_at || "").slice(0, 10)}</div>
                    <h2
                      className="mt-5 text-[28px] md:text-[36px] lg:text-[42px] leading-[1.18] font-semibold transition-colors duration-200 group-hover:text-[var(--tc-gold)]"
                      style={{ color: "var(--tc-navy)", fontFamily: lang === "ar" ? 'var(--lz-font-ar, "Thmanyah Serif Display"), serif' : '"Source Serif 4", serif' }}
                    >
                      {titleOf(p)}
                    </h2>
                    {summaryOf(p) && (
                      <p className="mt-5 text-[15.5px] leading-[1.75] max-w-[60ch]" style={{ color: "var(--tc-text-muted)" }}>{summaryOf(p)}</p>
                    )}
                  </div>
                </Link>
              ))}

              {/* Rest: editorial index list */}
              {rest.length > 0 && (
                <div className="mt-16 pt-10 border-t" style={{ borderColor: "var(--tc-rule)" }}>
                  <div className="tc-overline mb-6">{lang === "ar" ? "المزيد" : "More"}</div>
                  <div>
                    {rest.map((p, i) => (
                      <Link
                        key={p.id}
                        to={`/publications/${slugFor(p)}`}
                        className="tc-editorial-item"
                        data-testid={`pub-row-${p.id}`}
                      >
                        <span className="tc-num">{String(i + 3).padStart(2, "0")}</span>
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--tc-text-muted)" }}>
                            {p.publication_type?.replace("_", " ")}
                          </div>
                          <div className="tc-item-title">{titleOf(p)}</div>
                        </div>
                        <span className="tc-item-meta">{(p.published_at || p.created_at || "").slice(0, 10)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

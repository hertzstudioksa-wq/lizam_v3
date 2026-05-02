import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";

/**
 * Objectives — numbered editorial list on deep-navy background,
 * with brass accent numerals. Expandable bullet points per objective.
 */
export default function Objectives() {
  const { lang } = useLang();
  const { data: home } = useHomeContent();
  if (!home) return null;
  const items = home.objectives || [];

  return (
    <section id="objectives" className="relative bg-navy-deep text-ivory" data-testid="section-objectives">
      {/* Subtle pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(184,155,94,0.7) 0.5px, transparent 1px), radial-gradient(circle at 80% 70%, rgba(184,155,94,0.5) 0.5px, transparent 1px)",
          backgroundSize: "48px 48px, 64px 64px",
        }}
      />
      <div className="relative mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-start">
          <aside className="md:col-span-4 lg:col-span-4">
            <div className="lz-eyebrow text-brass">
              {lang === "ar" ? "الأهداف" : "Objectives"}
            </div>
            <div className="mt-4 h-px w-12 bg-brass" />
            <h2 className="lz-h2 mt-8 text-ivory max-w-[22ch]" style={{ color: "#FAF9F6" }}>
              {lang === "ar"
                ? "خمس أولويات تقود عمل المركز."
                : "Five priorities driving our work."}
            </h2>
            <p className="mt-6 text-[14.5px] leading-[1.9] text-ivory/70 max-w-[44ch]">
              {lang === "ar"
                ? "تنتظم أهداف المركز في خمسة محاور، يُبنى عليها جدول أعماله البحثي ومخرجاته السنوية."
                : "Our work is organised around five pillars that frame the research agenda and annual outputs."}
            </p>
          </aside>

          <div className="md:col-span-8 lg:col-span-8 space-y-px bg-ivory/10">
            {items.map((o, i) => (
              <ObjectiveRow
                key={o.id}
                num={String(i + 1).padStart(2, "0")}
                title={o[`title_${lang}`]}
                description={o[`description_${lang}`]}
                points={o[`points_${lang}`] || []}
                lang={lang}
                testid={`objective-${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ObjectiveRow({ num, title, description, points, lang, testid }) {
  return (
    <article
      className="group bg-navy-deep hover:bg-navy/60 transition-colors duration-500 p-7 md:p-8"
      data-testid={testid}
    >
      <div className="flex items-baseline gap-6">
        <span className="font-serif text-[28px] md:text-[32px] text-brass/90 tabular-nums leading-none">
          {num}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-[19px] md:text-[21px] font-medium text-ivory leading-snug"
              style={{ fontFamily: '"Thmanyah Serif Display", "Source Serif 4", serif' }}>
            {title}
          </h3>
          <p className="mt-3 text-[14px] md:text-[14.5px] leading-[1.9] text-ivory/72 max-w-[68ch]">
            {description}
          </p>
          {points.length > 0 && (
            <ul className="mt-4 space-y-2 text-[13.5px] leading-[1.8] text-ivory/60">
              {points.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-[12px] h-px w-4 bg-brass/70 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

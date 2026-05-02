import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";

/** Theme B — Objectives: deep navy ground, antique gold numerals, hairline-separated rows. */
export default function ObjectivesB() {
  const { lang } = useLang();
  const { data: home } = useHomeContent();
  if (!home) return null;
  const items = home.objectives || [];

  return (
    <section
      id="objectives"
      data-testid="section-objectives"
      data-theme-component="theme-b-objectives"
      style={{ background: "var(--tb-navy-900)", color: "var(--tb-paper-base)" }}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20 items-start">
          <aside className="md:col-span-4">
            <div className="tb-section-eyebrow">
              <span className="rule" />
              <span className="tb-overline">{lang === "ar" ? "الأهداف" : "Objectives"}</span>
            </div>
            <h2
              className="tb-display mt-8 max-w-[20ch]"
              style={{
                fontSize: "clamp(1.85rem, 3.2vw, 2.6rem)",
                lineHeight: 1.3,
                fontWeight: 500,
                color: "var(--tb-paper-base)",
              }}
            >
              {lang === "ar" ? "خمس أولويات تقود عمل المركز." : "Five priorities driving our work."}
            </h2>
            <p
              className="mt-7 max-w-[42ch]"
              style={{
                fontFamily: '"Thmanyah Serif Text", serif',
                fontSize: 16,
                lineHeight: 1.9,
                color: "rgba(249, 247, 243, 0.72)",
              }}
            >
              {lang === "ar"
                ? "تنتظم أهداف المركز في خمسة محاور، يُبنى عليها جدول أعماله البحثي ومخرجاته السنوية."
                : "Our work is organised around five pillars that frame the research agenda and annual outputs."}
            </p>
          </aside>

          <div className="md:col-span-8">
            <ol style={{ borderTop: "1px solid rgba(212, 185, 130, 0.22)" }}>
              {items.map((o, i) => (
                <li
                  key={o.id}
                  className="group py-7 transition-colors duration-500"
                  style={{ borderBottom: "1px solid rgba(212, 185, 130, 0.22)" }}
                  data-testid={`objective-${i + 1}`}
                >
                  <div className="flex items-baseline gap-7">
                    <span
                      className="tabular-nums shrink-0"
                      style={{
                        fontFamily: '"Thmanyah Serif Display", serif',
                        fontSize: 28,
                        lineHeight: 1,
                        color: "var(--tb-gold)",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-[20px] md:text-[22px] transition-colors duration-500"
                        style={{
                          fontFamily: '"Thmanyah Serif Display", serif',
                          color: "var(--tb-paper-base)",
                          fontWeight: 500,
                          lineHeight: 1.4,
                        }}
                      >
                        {o[`title_${lang}`]}
                      </h3>
                      <p
                        className="mt-3 max-w-[64ch]"
                        style={{
                          fontFamily: '"Thmanyah Sans", sans-serif',
                          fontSize: 14.5,
                          lineHeight: 1.9,
                          color: "rgba(249, 247, 243, 0.7)",
                        }}
                      >
                        {o[`description_${lang}`]}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

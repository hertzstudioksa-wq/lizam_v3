import { ScrollText, Scale, Landmark, BookOpen, Compass } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";

const ICONS = {
  "scroll-text": ScrollText,
  scale: Scale,
  landmark: Landmark,
  "book-open": BookOpen,
  compass: Compass,
};

/** Theme B — Fields of Work: editorial bordered grid with refined gold accents. */
export default function FieldsOfWorkB() {
  const { lang } = useLang();
  const { data: home } = useHomeContent();
  if (!home) return null;
  const items = home.fields_of_work || [];

  return (
    <section
      id="fields"
      data-testid="section-fields"
      data-theme-component="theme-b-fields"
      style={{ background: "var(--tb-paper-base)" }}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-end">
          <div className="md:col-span-5">
            <div className="tb-section-eyebrow">
              <span className="rule" />
              <span className="tb-overline">{lang === "ar" ? "مجالات العمل" : "Fields of Work"}</span>
            </div>
            <h2
              className="tb-display mt-8 max-w-[20ch]"
              style={{ fontSize: "clamp(1.85rem, 3.2vw, 2.6rem)", lineHeight: 1.3, fontWeight: 500 }}
            >
              {lang === "ar" ? "خمسة حقول بحثية متكاملة." : "Five research fields in dialogue."}
            </h2>
          </div>
          <p
            className="md:col-span-7 max-w-[58ch] md:pe-16"
            style={{ fontFamily: '"Thmanyah Serif Text", serif', fontSize: 16, lineHeight: 1.95, color: "var(--tb-text)" }}
          >
            {lang === "ar"
              ? "تتوزع أعمال المركز على حقول قانونية متكاملة، تمتد من الدراسات التشريعية والممارسات القضائية إلى السياسات العامة والشريعة الإسلامية والمجالات الناشئة."
              : "Our work spans complementary legal fields — from legislative studies and judicial practice to public policy, Islamic jurisprudence, and emerging domains."}
          </p>
        </div>

        <div
          className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{ borderTop: "1px solid var(--tb-hairline)", borderInlineStart: "1px solid var(--tb-hairline)" }}
        >
          {items.map((f) => {
            const Icon = ICONS[f.icon] || Compass;
            return (
              <article
                key={f.id}
                className="group p-8 lg:p-10 transition-colors duration-500"
                style={{
                  borderInlineEnd: "1px solid var(--tb-hairline)",
                  borderBottom: "1px solid var(--tb-hairline)",
                  background: "var(--tb-paper-surface)",
                }}
                data-testid={`field-${f.sort_order}`}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--tb-paper-deep)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--tb-paper-surface)"; }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] tabular-nums tracking-[0.2em]" style={{ color: "var(--tb-gold)" }}>
                    0{f.sort_order}
                  </span>
                  <Icon
                    size={18}
                    strokeWidth={1.4}
                    className="transition-colors duration-500"
                    style={{ color: "var(--tb-text-muted)" }}
                  />
                </div>
                <h3
                  className="mt-10 text-[19px] md:text-[21px]"
                  style={{ fontFamily: '"Thmanyah Serif Display", serif', color: "var(--tb-navy-900)", fontWeight: 500, lineHeight: 1.35 }}
                >
                  {f[`title_${lang}`]}
                </h3>
                <p
                  className="mt-4"
                  style={{ fontFamily: '"Thmanyah Sans", sans-serif', fontSize: 14, lineHeight: 1.9, color: "var(--tb-text-muted)" }}
                >
                  {f[`description_${lang}`]}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

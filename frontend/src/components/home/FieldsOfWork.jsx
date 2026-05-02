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

/**
 * Fields of Work — editorial grid with bordered cells, no radius,
 * icon + title + short description. Hairline separators, not cards.
 */
export default function FieldsOfWork() {
  const { lang } = useLang();
  const { data: home } = useHomeContent();
  if (!home) return null;
  const items = home.fields_of_work || [];

  return (
    <section id="fields" className="relative bg-ivory" data-testid="section-fields">
      <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-end">
          <div className="md:col-span-5">
            <div className="lz-eyebrow text-navy/70">
              {lang === "ar" ? "مجالات العمل" : "Fields of Work"}
            </div>
            <div className="mt-4 h-px w-12 bg-brass" />
            <h2 className="lz-h2 mt-8 max-w-[22ch]">
              {lang === "ar"
                ? "خمسة حقول بحثية متكاملة."
                : "Five research fields in dialogue."}
            </h2>
          </div>
          <p className="md:col-span-7 text-[15px] leading-[1.9] text-ink/70 max-w-[58ch] md:pe-16">
            {lang === "ar"
              ? "تتوزع أعمال المركز على حقول قانونية متكاملة، تمتد من الدراسات التشريعية والممارسات القضائية إلى السياسات العامة والشريعة الإسلامية والمجالات الناشئة."
              : "Our work spans complementary legal fields — from legislative studies and judicial practice to public policy, Islamic jurisprudence, and emerging domains."}
          </p>
        </div>

        <div className="mt-14 md:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-rule border border-rule">
          {items.map((f, i) => {
            const Icon = ICONS[f.icon] || Compass;
            return (
              <article
                key={f.id}
                className="group bg-white p-7 md:p-8 lg:p-9 transition-colors duration-500 hover:bg-ivory-cream"
                data-testid={`field-${i + 1}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] tabular-nums text-mute tracking-wider">
                    0{f.sort_order}
                  </span>
                  <Icon size={18} strokeWidth={1.4} className="text-navy/80 group-hover:text-brass transition-colors duration-500" />
                </div>
                <h3 className="lz-h3 mt-8 text-[19px] md:text-[21px]">{f[`title_${lang}`]}</h3>
                <p className="mt-4 text-[14px] leading-[1.85] text-ink/70">
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

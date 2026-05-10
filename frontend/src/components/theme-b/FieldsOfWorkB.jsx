import { ScrollText, Scale, Landmark, BookOpen, Compass } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { useImageAssets } from "@/hooks/useImageAssets";

const ICONS = {
  "scroll-text": ScrollText,
  scale: Scale,
  landmark: Landmark,
  "book-open": BookOpen,
  compass: Compass,
};

/** Theme B — Fields of Work (refined): softer cards, gold icon accents, refined radius. */
export default function FieldsOfWorkB() {
  const { lang } = useLang();
  const { data: home } = useHomeContent();
  const { bySlot } = useImageAssets();
  const bg = bySlot.fields_of_work_background;
  const hasBg = bg && bg.active && bg.url;
  if (!home) return null;
  const items = home.fields_of_work || [];

  return (
    <section
      id="fields"
      data-testid="section-fields"
      data-theme-component="theme-b-fields"
      className="relative isolate overflow-hidden"
      style={{ background: "var(--tb-paper-base)" }}
    >
      {hasBg && (
        <>
          <img
            src={bg.url}
            alt={bg.alt_ar || bg.alt_en || ""}
            aria-hidden
            className="absolute inset-0 w-full h-full"
            style={{
              objectFit: "cover",
              objectPosition: `${bg.focal_x ?? 50}% ${bg.focal_y ?? 50}%`,
              zIndex: 0,
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "rgba(251, 250, 247, 0.88)", zIndex: 0 }}
          />
        </>
      )}
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-end">
          <div className="md:col-span-5">
            <div className="tb-section-eyebrow">
              <span className="rule" />
              <span className="tb-overline">{home[`fields_eyebrow_${lang}`] || (lang === "ar" ? "مجالات العمل" : "Fields of Work")}</span>
            </div>
            <h2
              className="tb-display mt-7 max-w-[20ch]"
              style={{ fontSize: "clamp(2rem, 3.4vw, 2.85rem)", lineHeight: 1.25, fontWeight: 500 }}
            >
              {lang === "ar" ? "حقول بحثية متكاملة." : "Five research fields, in dialogue."}
            </h2>
          </div>
          <p
            className="md:col-span-7 max-w-[60ch] md:pe-16 tb-body-lg"
            style={{ color: "var(--tb-text)" }}
          >
            {lang === "ar"
              ? "تتوزع أعمال المركز على حقول قانونية متكاملة، تمتد من الدراسات التشريعية والممارسات القضائية إلى السياسات العامة والشريعة الإسلامية والمجالات الناشئة."
              : "Our work spans complementary legal fields — from legislative studies and judicial practice to public policy, Islamic jurisprudence, and emerging domains."}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((f) => {
            const Icon = ICONS[f.icon] || Compass;
            return (
              <article
                key={f.id}
                className="tb-card flex flex-col"
                data-testid={`field-${f.sort_order}`}
                style={{ minHeight: 240 }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: '"Thmanyah Sans", sans-serif',
                      fontSize: 11,
                      color: "var(--tb-gold)",
                      letterSpacing: "0.22em",
                    }}
                  >
                    0{f.sort_order}
                  </span>
                  <span
                    className="inline-flex items-center justify-center"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--tb-radius-pill)",
                      background: "var(--tb-gold-faint)",
                      color: "var(--tb-gold-deep)",
                    }}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                  </span>
                </div>
                <h3
                  className="mt-8 text-[19px] md:text-[21px]"
                  style={{
                    fontFamily: '"Thmanyah Serif Display", serif',
                    color: "var(--tb-navy-900)",
                    fontWeight: 500,
                    lineHeight: 1.35,
                  }}
                >
                  {f[`title_${lang}`]}
                </h3>
                <p
                  className="mt-4"
                  style={{
                    fontFamily: '"Thmanyah Sans", sans-serif',
                    fontSize: 15,
                    lineHeight: 1.9,
                    color: "var(--tb-text-muted)",
                  }}
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

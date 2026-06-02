import { ScrollText, Scale, Landmark, BookOpen, Compass } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";
import { useImageAssets } from "@/hooks/useImageAssets";
import { getTextStyles, getTextAlign, getGradientOverlay } from "@/lib/sectionTypo";
import Reveal from "@/components/theme-b/Reveal";

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
  // Prefer admin-controlled bg from /admin/home → Fields of Work card.
  const sec = home?.section_styles?.fields_of_work?.bg;
  const useSec = sec?.enabled !== false && sec?.url;
  const legacy = bySlot.fields_of_work_background;
  const bg = useSec ? sec : legacy;
  const hasBg = (useSec && sec.url) || (legacy && legacy.active && legacy.url);
  if (!home) return null;
  // Visibility — defaults to TRUE when admin hasn't explicitly hidden the section.
  const vs = home?.visible_sections;
  if (Array.isArray(vs) && vs.length > 0 && !vs.includes("fields_of_work")) return null;
  const items = home.fields_of_work || [];
  const titleScale = home?.section_styles?.fields_of_work?.title_scale ?? 1;
  const tsEyebrow = getTextStyles(home, "fields_of_work", "eyebrow");
  const tsSectionTitle = getTextStyles(home, "fields_of_work", "section_title");
  const tsSectionBody = getTextStyles(home, "fields_of_work", "section_body");
  const tsItemTitle = getTextStyles(home, "fields_of_work", "item_title");
  const tsItemDesc = getTextStyles(home, "fields_of_work", "item_desc");
  // Per-field alignment overrides
  const alignEyebrow = getTextAlign(home, "fields_of_work", "eyebrow");
  const alignSectionTitle = getTextAlign(home, "fields_of_work", "section_title");
  const alignSectionBody = getTextAlign(home, "fields_of_work", "section_body");
  const alignItemTitle = getTextAlign(home, "fields_of_work", "item_title");
  const alignItemDesc = getTextAlign(home, "fields_of_work", "item_desc");
  const gradStyle = getGradientOverlay(home, "fields_of_work");

  return (
    <section
      id="fields"
      data-testid="section-fields"
      data-theme-component="theme-b-fields"
      className="relative isolate overflow-hidden"
      style={{ backgroundColor: home?.section_styles?.fields_of_work?.bg_color || "var(--tb-paper-base)" }}
    >
      {gradStyle.backgroundImage && (
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ ...gradStyle, zIndex: 1 }} />
      )}
      {hasBg && (
        <>
          <img
            src={bg.url}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full"
            style={{
              objectFit: "cover",
              objectPosition: `${bg.focal_x ?? 50}% ${bg.focal_y ?? 50}%`,
              zIndex: 0,
            }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
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
              <span
                className="tb-overline"
                style={{
                  color: tsEyebrow.color,
                  fontSize: tsEyebrow.sizeMul !== 1 ? `calc(0.78rem * ${tsEyebrow.sizeMul})` : undefined,
                  fontWeight: tsEyebrow.fontWeight,
                  textAlign: alignEyebrow || undefined,
                }}
              >{home[`fields_eyebrow_${lang}`] || (lang === "ar" ? "مجالات العمل" : "Fields of Work")}</span>
            </div>
            <h2
              className="tb-display mt-7 max-w-[20ch]"
              style={{
                fontSize: `calc(clamp(2rem, 3.4vw, 2.85rem) * ${titleScale} * ${tsSectionTitle.sizeMul})`,
                lineHeight: 1.25,
                fontWeight: tsSectionTitle.fontWeight ?? 500,
                color: tsSectionTitle.color,
                textAlign: alignSectionTitle || undefined,
              }}
              data-testid="fields-title"
            >
              {home?.[`fields_title_${lang}`] || (lang === "ar" ? "حقول بحثية متكاملة." : "Five research fields, in dialogue.")}
            </h2>
          </div>
          <p
            className="md:col-span-7 max-w-[60ch] md:pe-16 tb-body-lg"
            style={{
              color: tsSectionBody.color || "var(--tb-text)",
              fontSize: tsSectionBody.sizeMul !== 1 ? `calc(1.1875rem * ${tsSectionBody.sizeMul})` : undefined,
              fontWeight: tsSectionBody.fontWeight,
              textAlign: alignSectionBody || "justify",
              textAlignLast: "right",
              whiteSpace: "pre-line",
            }}
            data-testid="fields-body"
          >
            {home?.[`fields_body_${lang}`] || (lang === "ar"
              ? "تتوزع أعمال المركز على حقول قانونية متكاملة، تمتد من الدراسات التشريعية والممارسات القضائية إلى السياسات العامة والشريعة الإسلامية والمجالات الناشئة."
              : "Our work spans complementary legal fields — from legislative studies and judicial practice to public policy, Islamic jurisprudence, and emerging domains.")}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((f, i) => {
            const Icon = ICONS[f.icon] || Compass;
            return (
              <Reveal
                key={f.id}
                variant="up"
                delay={Math.min(5, i)}
                as="article"
                className="tb-card tb-card-hover flex flex-col"
                style={{ minHeight: 240, transitionDuration: "0.5s" }}
                data-testid={`field-${f.sort_order}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: '"Thmanyah Sans", sans-serif',
                      fontSize: 11,
                      color: "var(--tb-gold)",
                      letterSpacing: lang === "ar" ? "0.02em" : "0.22em",
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
                    color: tsItemTitle.color || "var(--tb-navy-900)",
                    fontWeight: tsItemTitle.fontWeight ?? 500,
                    lineHeight: 1.35,
                    fontSize: tsItemTitle.sizeMul !== 1 ? `calc(21px * ${titleScale} * ${tsItemTitle.sizeMul})` : undefined,
                    textAlign: alignItemTitle || undefined,
                  }}
                >
                  {f[`title_${lang}`]}
                </h3>
                <p
                  className="mt-4"
                  style={{
                    fontFamily: '"Thmanyah Sans", sans-serif',
                    fontSize: tsItemDesc.sizeMul !== 1 ? `calc(15px * ${tsItemDesc.sizeMul})` : 15,
                    lineHeight: 1.9,
                    color: tsItemDesc.color || "var(--tb-text-muted)",
                    fontWeight: tsItemDesc.fontWeight,
                    textAlign: alignItemDesc || "justify",
                    textAlignLast: "right",
                    whiteSpace: "pre-line",
                  }}
                >
                  {f[`description_${lang}`]}
                </p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

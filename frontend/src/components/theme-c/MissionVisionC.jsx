import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";

export default function MissionVisionC() {
  const { lang } = useLang();
  const home = useHomeContent();
  const mission = lang === "ar" ? home?.mission_ar : home?.mission_en;
  const vision = lang === "ar" ? home?.vision_ar : home?.vision_en;

  const items = [
    {
      label: lang === "ar" ? "الرسالة" : "Mission",
      body: mission || (lang === "ar"
        ? "إنتاج معرفة قانونية موضوعية تستوعب السياق المحلي وتسهم في تطوير المنظومة التشريعية والممارسة المؤسسية."
        : "Producing objective legal scholarship grounded in local context, supporting legislative and institutional development."),
      num: "01",
    },
    {
      label: lang === "ar" ? "الرؤية" : "Vision",
      body: vision || (lang === "ar"
        ? "أن نكون مرجعاً علمياً سعودياً موثوقاً في الدراسات القانونية والسياسات العامة، يُسهم في تشكيل النقاش وصنع القرار."
        : "To be a trusted Saudi reference in legal studies and public policy, shaping discourse and informing decision-making."),
      num: "02",
    },
  ];

  return (
    <section
      className="relative py-24 md:py-32"
      style={{ background: "var(--tc-navy)", color: "var(--tc-ivory)" }}
      data-testid="section-mission-vision"
      data-theme-component="theme-c-mission-vision"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {items.map((it, i) => (
            <article key={i} className={`${i === 0 ? "lg:col-span-7" : "lg:col-span-5 lg:pt-16"}`} data-testid={`mv-${i}`}>
              <div className="flex items-baseline gap-5">
                <span className="text-[14px] tabular-nums" style={{ color: "var(--tc-gold)" }}>{it.num}</span>
                <span className="tc-eyebrow-light">{it.label}</span>
              </div>
              <h3
                className="mt-7 text-[28px] md:text-[34px] lg:text-[40px] leading-[1.25] font-semibold"
                style={{ fontFamily: lang === "ar" ? 'var(--lz-font-ar, "Thmanyah Serif Display"), serif' : '"Source Serif 4", serif' }}
              >
                {it.body}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { useImageAsset } from "@/hooks/useImageAssets";
import { useCategories } from "@/hooks/usePublications";

const FALLBACK = "https://images.unsplash.com/photo-1596396546288-736a73214a84?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600";

export default function FieldsOfWorkC() {
  const { lang } = useLang();
  const cats = useCategories() || [];
  const heroImg = useImageAsset("theme_c_fields_hover_bg");
  const fallbackBg = heroImg?.url || FALLBACK;
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!cats.length) return null;

  const active = hoverIdx == null ? null : cats[hoverIdx];

  return (
    <section
      className="relative py-24 md:py-32"
      style={{ background: "var(--tc-navy-dark)", color: "var(--tc-ivory)" }}
      data-testid="section-fields-of-work"
      data-theme-component="theme-c-fields-of-work"
    >
      {/* Side image panel — desktop hover reveal */}
      <div
        className="hidden lg:block absolute inset-y-0 end-0 w-[42%] pointer-events-none transition-opacity duration-700"
        style={{
          opacity: hoverIdx != null ? 0.55 : 0.18,
          backgroundImage: `linear-gradient(to right, var(--tc-navy-dark) 0%, rgba(4,9,20,0.4) 60%, transparent 100%), url("${fallbackBg}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14">
        <div className="lg:max-w-[60%]">
          <div className="tc-eyebrow-light">{lang === "ar" ? "مجالات العمل" : "Fields of Work"}</div>
          <h2
            className="mt-5 text-[34px] md:text-[44px] lg:text-[52px] leading-[1.15] font-semibold"
            style={{ fontFamily: lang === "ar" ? 'var(--lz-font-ar, "Thmanyah Serif Display"), serif' : '"Source Serif 4", serif' }}
          >
            {lang === "ar" ? "خمسة مجالات بحثية متخصصة" : "Five specialised research domains"}
          </h2>
          <p className="mt-4 max-w-[58ch] text-[15px]" style={{ color: "rgba(248,247,243,0.65)" }}>
            {lang === "ar"
              ? "نُنتج دراسات وأوراق سياسات ضمن مجالات قانونية مترابطة تخدم السياسة العامة والممارسة القضائية."
              : "Studies and policy papers across interconnected legal domains that serve public policy and judicial practice."}
          </p>
        </div>

        <div className="mt-12 lg:max-w-[62%]">
          {cats.map((c, i) => {
            const title = lang === "ar" ? c.title_ar : c.title_en;
            const desc = lang === "ar" ? c.description_ar : c.description_en;
            return (
              <div
                key={c.id}
                className="tc-fow-row"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                data-testid={`fow-row-${c.id}`}
              >
                <span className="tc-fow-num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="tc-fow-title">{title}</div>
                  {desc && hoverIdx === i && (
                    <div className="mt-2 text-[13.5px] max-w-[52ch]" style={{ color: "rgba(248,247,243,0.7)" }}>{desc}</div>
                  )}
                </div>
                <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: hoverIdx === i ? "var(--tc-gold)" : "rgba(248,247,243,0.35)" }}>
                  {lang === "ar" ? "استعراض" : "Explore"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

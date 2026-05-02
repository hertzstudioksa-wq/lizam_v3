import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";

/**
 * Mission & Vision — side by side on desktop, stacked on mobile.
 * Ink block on left, brass-accented block on right. Shared background = ivory.
 */
export default function MissionVision() {
  const { lang, pick } = useLang();
  const { data: home } = useHomeContent();
  if (!home) return null;

  const mission = pick(home, "mission");
  const vision = pick(home, "vision");
  const mp = home[`mission_points_${lang}`] || [];
  const vp = home[`vision_points_${lang}`] || [];

  return (
    <section id="mission-vision" className="relative bg-ivory" data-testid="section-mission-vision">
      <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16">
          {/* Mission */}
          <article className="lg:col-span-6 relative" data-testid="block-mission">
            <div className="lz-eyebrow text-navy/70">
              {lang === "ar" ? "الرسالة" : "Mission"}
            </div>
            <div className="mt-4 h-px w-12 bg-brass" />
            <h3 className="lz-h3 mt-8 max-w-[34ch]">
              {lang === "ar" ? "رسالتنا" : "Our mission"}
            </h3>
            <p className="mt-5 text-[15px] md:text-[16px] leading-[1.9] text-ink/85 max-w-[54ch]">
              {mission}
            </p>
            {mp.length > 0 && (
              <ul className="mt-8 space-y-4 text-[14.5px] leading-[1.9] text-ink/80">
                {mp.map((p, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="mt-[14px] h-px w-6 bg-brass shrink-0" />
                    <span className="max-w-[58ch]">{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          {/* Divider */}
          <div className="hidden lg:block lg:col-span-0 absolute left-1/2 top-0 bottom-0 lz-vertical-rule" />

          {/* Vision */}
          <article className="lg:col-span-6" data-testid="block-vision">
            <div className="lz-eyebrow text-navy/70">
              {lang === "ar" ? "الرؤية" : "Vision"}
            </div>
            <div className="mt-4 h-px w-12 bg-brass" />
            <h3 className="lz-h3 mt-8 max-w-[34ch]">
              {lang === "ar" ? "رؤيتنا" : "Our vision"}
            </h3>
            <p className="mt-5 text-[15px] md:text-[16px] leading-[1.9] text-ink/85 max-w-[54ch]">
              {vision}
            </p>
            {vp.length > 0 && (
              <ul className="mt-8 space-y-4 text-[14.5px] leading-[1.9] text-ink/80">
                {vp.map((p, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="mt-[14px] h-px w-6 bg-brass shrink-0" />
                    <span className="max-w-[58ch]">{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </div>
      <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14">
        <div className="lz-hairline" />
      </div>
    </section>
  );
}

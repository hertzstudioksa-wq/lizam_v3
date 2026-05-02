import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";

/**
 * About — editorial two-column block. Eyebrow rail on the outer edge,
 * measured prose on the inner. No card, no background tile.
 */
export default function About() {
  const { lang, pick } = useLang();
  const { data: home } = useHomeContent();
  if (!home) return null;

  const body = pick(home, "about");
  const extended = pick(home, "about_extended");

  return (
    <section id="about" className="relative bg-ivory" data-testid="section-about">
      <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14">
          <aside className="md:col-span-4 lg:col-span-3">
            <div className="lz-eyebrow text-navy/70">
              {lang === "ar" ? "عن المركز" : "About the Center"}
            </div>
            <div className="mt-4 h-px w-12 bg-brass" />
            <p className="mt-6 text-[12.5px] uppercase tracking-[0.22em] text-mute">
              <span className={lang === "ar" ? "font-arabic tracking-normal" : ""}>
                {lang === "ar" ? "§ 01" : "§ 01"}
              </span>
            </p>
          </aside>
          <div className="md:col-span-8 lg:col-span-9">
            <h2 className="lz-h2 max-w-[48ch]">
              {lang === "ar"
                ? "مركز بحثي سعودي متخصص في الدراسات القانونية والسياسات العامة."
                : "A Saudi research center specializing in legal studies and public policy."}
            </h2>
            <div className="mt-8 space-y-6 text-[15.5px] md:text-[16.5px] leading-[1.9] text-ink/85 max-w-[65ch]">
              <p>{body}</p>
              {extended && <p>{extended}</p>}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14">
        <div className="lz-hairline" />
      </div>
    </section>
  );
}

import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";

/** Theme B — About: editorial layout with section number marker. */
export default function AboutB() {
  const { lang, pick } = useLang();
  const { data: home } = useHomeContent();
  if (!home) return null;
  const body = pick(home, "about");
  const extended = pick(home, "about_extended");

  return (
    <section
      id="about"
      data-testid="section-about"
      data-theme-component="theme-b-about"
      style={{ background: "var(--tb-paper-base)" }}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
          <aside className="md:col-span-4 lg:col-span-3">
            <div className="tb-section-eyebrow">
              <span className="rule" />
              <span className="tb-overline">{lang === "ar" ? "عن المركز" : "About"}</span>
            </div>
            <p
              className="mt-8 text-[60px] leading-none"
              style={{ fontFamily: '"Thmanyah Serif Display", serif', color: "var(--tb-gold)", fontWeight: 400 }}
            >
              §<span className="tabular-nums" style={{ fontSize: "0.5em", marginInlineStart: "0.4em", color: "var(--tb-text-muted)" }}>01</span>
            </p>
          </aside>
          <div className="md:col-span-8 lg:col-span-9">
            <h2
              className="tb-display max-w-[42ch]"
              style={{ fontSize: "clamp(1.85rem, 3.2vw, 2.6rem)", lineHeight: 1.3, fontWeight: 500 }}
            >
              {lang === "ar"
                ? "مركز بحثي سعودي متخصص في الدراسات القانونية والسياسات العامة."
                : "A Saudi research center specializing in legal studies and public policy."}
            </h2>
            <div
              className="mt-10 space-y-7 max-w-[68ch]"
              style={{
                fontFamily: '"Thmanyah Serif Text", serif',
                fontSize: 17,
                lineHeight: 1.95,
                color: "var(--tb-text)",
              }}
            >
              <p>{body}</p>
              {extended && <p>{extended}</p>}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-20">
        <div style={{ height: 1, background: "var(--tb-hairline)" }} />
      </div>
    </section>
  );
}

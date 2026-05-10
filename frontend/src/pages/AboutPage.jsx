import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import HeroMediaLayer from "@/components/hero/HeroMediaLayer";
import { useLang } from "@/i18n/LanguageContext";
import { useHomeContent } from "@/hooks/useSiteSettings";

/**
 * Public /about page — uses the same authoritative content as the home page
 * (about_ar/en + about_extended + mission + vision + objectives), so editors
 * have a single source of truth in /admin/home and /about reflects every
 * change automatically.
 */
export default function AboutPage() {
  const { lang, pick } = useLang();
  const { data: home } = useHomeContent();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  if (!home) return <PublicLayout><div className="pt-[140px] pb-20 text-center text-mute">…</div></PublicLayout>;

  const about = pick(home, "about");
  const aboutExt = pick(home, "about_extended");
  const mission = pick(home, "mission");
  const vision = pick(home, "vision");
  const mp = home[`mission_points_${lang}`] || [];
  const vp = home[`vision_points_${lang}`] || [];
  const objectives = (home.objectives || []).map((o) => ({
    title: lang === "ar" ? o.title_ar : o.title_en,
    desc:  lang === "ar" ? o.description_ar : o.description_en,
    id: o.id,
  }));
  const aboutEyebrow = home[`about_eyebrow_${lang}`] || (lang === "ar" ? "عن المركز" : "About");
  const missionEyebrow = home[`mission_eyebrow_${lang}`] || (lang === "ar" ? "المنطلقات" : "Foundations");
  const objectivesEyebrow = home[`objectives_eyebrow_${lang}`] || (lang === "ar" ? "الأهداف" : "Objectives");
  const contactEyebrow = home[`contact_eyebrow_${lang}`] || (lang === "ar" ? "تواصل" : "Contact");

  return (
    <PublicLayout>
      {/* ---------- Cinematic masthead ---------- */}
      <section
        className="relative isolate pt-[130px] md:pt-[150px] pb-16 md:pb-20 min-h-[58vh] overflow-hidden"
        style={{ background: "var(--tb-navy-900, #0A111C)", color: "var(--tb-paper-base, #FBFAF7)" }}
        data-testid="about-masthead"
      >
        <HeroMediaLayer pageKey="about" extendBehindHeader />
        <div className="relative z-10 mx-auto max-w-[1200px] px-6 md:px-10 lg:px-14 flex flex-col justify-end h-full">
          <div className="flex items-center gap-3">
            <span style={{ height: 1, width: 26, background: "var(--tb-gold)" }} />
            <span className="tb-overline" style={{ color: "var(--tb-gold)" }}>{aboutEyebrow}</span>
          </div>
          <h1
            className="tb-display mt-5 max-w-[26ch]"
            style={{ color: "var(--tb-paper-base)", fontSize: "clamp(1.85rem, 3.4vw, 2.85rem)", lineHeight: 1.2 }}
          >
            {lang === "ar"
              ? "بحث قانوني رصين، يخدم الحوكمة والسياسات."
              : "Rigorous legal research in service of governance and policy."}
          </h1>
        </div>
      </section>

      {/* ---------- About body ---------- */}
      <section
        className="py-20 md:py-24"
        style={{ background: "var(--tb-paper-base)" }}
        data-testid="about-intro"
      >
        <div className="mx-auto max-w-[840px] px-6 md:px-10">
          <p className="tb-body-lg" style={{ fontSize: 17.5, lineHeight: 1.95, color: "var(--tb-text)" }}>{about}</p>
          {aboutExt && (
            <p className="mt-6" style={{ fontSize: 16, lineHeight: 1.95, color: "var(--tb-text-muted)" }}>{aboutExt}</p>
          )}
        </div>
      </section>

      {/* ---------- Mission & Vision ---------- */}
      <section
        className="py-20 md:py-24"
        style={{ background: "var(--tb-paper-deep)" }}
        data-testid="about-mission-vision"
      >
        <div className="mx-auto max-w-[1180px] px-6 md:px-10 lg:px-12">
          <div className="max-w-[680px]">
            <div className="flex items-center gap-3">
              <span style={{ height: 1, width: 24, background: "var(--tb-gold)" }} />
              <span className="tb-overline">{missionEyebrow}</span>
            </div>
            <h2 className="tb-display mt-4" style={{ fontSize: "clamp(1.6rem, 2.1vw, 2rem)", lineHeight: 1.32, fontWeight: 500, maxWidth: "32ch" }}>
              {lang === "ar" ? "ما الذي يقود عملنا، وإلى أين نتجه." : "What drives our work — and where we are headed."}
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-7 items-stretch">
            {[
              {
                idx: "01",
                kicker: lang === "ar" ? "الرسالة" : "Mission",
                title: lang === "ar"
                  ? "بحث قانوني رصين يخدم الحوكمة والسياسات."
                  : "Rigorous legal research in the service of governance.",
                body: mission,
                points: mp,
                testid: "block-mission",
              },
              {
                idx: "02",
                kicker: lang === "ar" ? "الرؤية" : "Vision",
                title: lang === "ar"
                  ? "مرجع موثوق للدراسات القانونية في المملكة."
                  : "A trusted reference for legal studies in the Kingdom.",
                body: vision,
                points: vp,
                testid: "block-vision",
              },
            ].map((c) => (
              <article
                key={c.idx}
                className="tb-card flex flex-col h-full"
                style={{ padding: "2.1rem 2.25rem 2.25rem" }}
                data-testid={c.testid}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span style={{ fontSize: 13, color: "var(--tb-text-muted)", letterSpacing: "0.18em", fontFeatureSettings: '"tnum" 1', fontWeight: 500 }}>{c.idx}</span>
                    <span style={{ height: 1, width: 26, background: "var(--tb-gold)" }} />
                    <span className="tb-overline" style={{ fontSize: 13 }}>{c.kicker}</span>
                  </div>
                </div>
                <h3 className="tb-display mt-6" style={{ fontSize: "clamp(1.25rem, 1.5vw, 1.45rem)", lineHeight: 1.45, fontWeight: 500, maxWidth: "30ch" }}>{c.title}</h3>
                <p className="mt-4" style={{ fontSize: 16, lineHeight: 1.9, color: "var(--tb-text)", maxWidth: "60ch" }}>{c.body}</p>
                {c.points.length > 0 && (
                  <ul className="mt-7 space-y-3.5" style={{ borderTop: "1px solid var(--tb-hairline)", paddingTop: "1.25rem" }}>
                    {c.points.map((p, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span aria-hidden style={{ marginTop: 11, flexShrink: 0, width: 14, height: 1, background: "var(--tb-gold)" }} />
                        <span style={{ fontSize: 15, lineHeight: 1.85, color: "var(--tb-text)" }}>{p}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Objectives ---------- */}
      {objectives.length > 0 && (
        <section
          className="py-20 md:py-24"
          style={{ background: "var(--tb-paper-base)" }}
          data-testid="about-objectives"
        >
          <div className="mx-auto max-w-[1180px] px-6 md:px-10 lg:px-12">
            <div className="max-w-[680px]">
              <div className="flex items-center gap-3">
                <span style={{ height: 1, width: 24, background: "var(--tb-gold)" }} />
                <span className="tb-overline">{objectivesEyebrow}</span>
              </div>
              <h2 className="tb-display mt-4" style={{ fontSize: "clamp(1.5rem, 2.1vw, 1.95rem)", lineHeight: 1.32, fontWeight: 500, maxWidth: "32ch" }}>
                {lang === "ar" ? "خمسة أهداف تحدد أولوياتنا البحثية." : "Five priorities that shape our research."}
              </h2>
            </div>

            <ol className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6" data-testid="about-objectives-grid">
              {objectives.map((o, i) => (
                <li
                  key={o.id}
                  className="tb-card flex flex-col gap-3"
                  style={{ padding: "1.75rem 2rem 2rem" }}
                  data-testid={`about-objective-${i}`}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 13, color: "var(--tb-gold)", letterSpacing: "0.22em", fontWeight: 600 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ height: 1, width: 22, background: "var(--tb-gold)" }} />
                  </div>
                  <h3 className="tb-display" style={{ fontSize: "1.15rem", lineHeight: 1.4, fontWeight: 500 }}>{o.title}</h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.85, color: "var(--tb-text)" }}>{o.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ---------- Contact CTA ---------- */}
      <section
        className="py-16 md:py-20"
        style={{ background: "var(--tb-navy-900)", color: "var(--tb-paper-base)" }}
        data-testid="about-contact-cta"
      >
        <div className="mx-auto max-w-[860px] px-6 md:px-10 text-center">
          <span className="tb-overline" style={{ color: "var(--tb-gold)" }}>{contactEyebrow}</span>
          <h2 className="tb-display mt-4" style={{ color: "var(--tb-paper-base)", fontSize: "clamp(1.4rem, 2.1vw, 1.85rem)", lineHeight: 1.35 }}>
            {lang === "ar"
              ? "نرحّب بالتعاون البحثي والاستفسارات المؤسسية."
              : "We welcome research collaboration and institutional enquiries."}
          </h2>
          <Link
            to="/contact"
            className="tb-btn-primary inline-flex items-center gap-2 mt-7 text-[14px]"
            data-testid="about-contact-link"
          >
            <span>{lang === "ar" ? "تواصل معنا" : "Get in touch"}</span>
            <Arrow size={16} strokeWidth={1.6} />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}

import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageContext";
import { useSiteSettings, useHomeContent } from "@/hooks/useSiteSettings";
import { getTextStyles, getTextAlign, getGradientOverlay } from "@/lib/sectionTypo";
import Reveal from "@/components/theme-b/Reveal";

/** Theme B — Contact Block: editorial pairing + premium email lockup. */
export default function ContactBlockB() {
  const { lang } = useLang();
  const { data: site } = useSiteSettings();
  const { data: home } = useHomeContent();
  // Visibility — defaults to TRUE when the admin hasn't explicitly hidden the section.
  const vs = home?.visible_sections;
  if (Array.isArray(vs) && vs.length > 0 && !vs.includes("contact")) return null;
  const email = site?.contact_email || "info@lizam.sa";
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const tsEyebrow = getTextStyles(home, "contact", "eyebrow");
  const tsTitle = getTextStyles(home, "contact", "title");
  const tsBlurb = getTextStyles(home, "contact", "blurb");
  const alignEyebrow = getTextAlign(home, "contact", "eyebrow");
  const alignTitle = getTextAlign(home, "contact", "title");
  const alignBlurb = getTextAlign(home, "contact", "blurb");
  const gradStyle = getGradientOverlay(home, "contact");

  return (
    <section
      id="contact"
      data-testid="section-contact"
      data-theme-component="theme-b-contact"
      className="relative isolate"
      style={{ backgroundColor: home?.section_styles?.contact?.bg_color || "var(--tb-paper-base)" }}
    >
      {gradStyle.backgroundImage && (
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={gradStyle} />
      )}
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 md:px-12 lg:px-20 py-24 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20 items-start">
          <Reveal variant="right" className="md:col-span-5" style={{ transitionDuration: "0.7s" }}>
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
              >{home?.[`contact_eyebrow_${lang}`] || (lang === "ar" ? "تواصل" : "Contact")}</span>
            </div>
            <h2
              className="tb-display mt-8 max-w-[22ch]"
              style={{
                fontSize: `calc(clamp(1.85rem, 3.2vw, 2.6rem) * ${tsTitle.sizeMul})`,
                lineHeight: 1.3,
                fontWeight: tsTitle.fontWeight ?? 500,
                color: tsTitle.color,
                textAlign: alignTitle || undefined,
              }}
              data-testid="contact-headline"
            >
              {home?.[`contact_title_${lang}`] || (lang === "ar"
                ? "للتعاون البحثي والاستفسارات المؤسسية."
                : "For research collaboration and institutional enquiries.")}
            </h2>
          </Reveal>
          <Reveal variant="left" className="md:col-span-7 space-y-10" style={{ transitionDuration: "0.7s" }}>
            <p
              className="max-w-[60ch]"
              style={{
                fontFamily: '"Thmanyah Serif Text", serif',
                fontSize: tsBlurb.sizeMul !== 1 ? `calc(16.5px * ${tsBlurb.sizeMul})` : 16.5,
                lineHeight: 1.95,
                color: tsBlurb.color || "var(--tb-text)",
                fontWeight: tsBlurb.fontWeight,
                textAlign: alignBlurb || "justify",
                textAlignLast: "right",
                whiteSpace: "pre-line",
              }}
              data-testid="contact-body"
            >
              {home?.[`contact_blurb_${lang}`] || (lang === "ar"
                ? "يرحّب المركز بالتواصل من المؤسسات الحكومية والخاصة وجمعيات القطاع غير الربحي، ومن الباحثين المهتمين بالتعاون البحثي أو الاستشاري."
                : "We welcome enquiries from government, private, and non-profit institutions, and from researchers interested in collaboration or advisory engagements.")}
            </p>

            <div className="pt-8" style={{ borderTop: "1px solid var(--tb-hairline)" }}>
              <div className="tb-overline mb-4" style={{ color: "var(--tb-text-muted)" }}>
                {lang === "ar" ? "البريد الإلكتروني" : "Email"}
              </div>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-3 group transition-colors duration-400"
                style={{ fontSize: 22, color: "var(--tb-navy-900)" }}
                data-testid="contact-email"
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--tb-gold)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--tb-navy-900)"; }}
              >
                {lang === "ar" ? (
                  <>
                    <Mail size={18} strokeWidth={1.5} />
                    <span style={{ direction: "ltr", unicodeBidi: "embed" }}>{email}</span>
                  </>
                ) : (
                  <>
                    <Mail size={18} strokeWidth={1.5} />
                    <span>{email}</span>
                  </>
                )}
              </a>
            </div>

            <div>
              <Link to="/contact" className="tb-btn-primary" data-testid="contact-cta">
                <span>{lang === "ar" ? "نموذج التواصل" : "Contact form"}</span>
                <Arrow size={16} strokeWidth={1.6} />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

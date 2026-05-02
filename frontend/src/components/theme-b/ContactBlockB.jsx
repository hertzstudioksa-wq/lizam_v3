import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/** Theme B — Contact Block: editorial pairing + premium email lockup. */
export default function ContactBlockB() {
  const { lang } = useLang();
  const { data: site } = useSiteSettings();
  const email = site?.contact_email || "info@lizam.sa";
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section
      id="contact"
      data-testid="section-contact"
      data-theme-component="theme-b-contact"
      style={{ background: "var(--tb-paper-base)" }}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-20 py-24 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20 items-start">
          <div className="md:col-span-5">
            <div className="tb-section-eyebrow">
              <span className="rule" />
              <span className="tb-overline">{lang === "ar" ? "تواصل" : "Contact"}</span>
            </div>
            <h2
              className="tb-display mt-8 max-w-[22ch]"
              style={{ fontSize: "clamp(1.85rem, 3.2vw, 2.6rem)", lineHeight: 1.3, fontWeight: 500 }}
            >
              {lang === "ar"
                ? "للتعاون البحثي والاستفسارات المؤسسية."
                : "For research collaboration and institutional enquiries."}
            </h2>
          </div>
          <div className="md:col-span-7 space-y-10">
            <p
              className="max-w-[60ch]"
              style={{ fontFamily: '"Thmanyah Serif Text", serif', fontSize: 16.5, lineHeight: 1.95, color: "var(--tb-text)" }}
            >
              {lang === "ar"
                ? "يرحّب المركز بالتواصل من المؤسسات الحكومية والخاصة وجمعيات القطاع غير الربحي، ومن الباحثين المهتمين بالتعاون البحثي أو الاستشاري."
                : "We welcome enquiries from government, private, and non-profit institutions, and from researchers interested in collaboration or advisory engagements."}
            </p>

            <div className="pt-8" style={{ borderTop: "1px solid var(--tb-hairline)" }}>
              <div className="tb-overline mb-4" style={{ color: "var(--tb-text-muted)" }}>
                {lang === "ar" ? "البريد الإلكتروني" : "Email"}
              </div>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-3 group transition-colors duration-400"
                style={{ fontFamily: '"Thmanyah Serif Display", serif', fontSize: 22, color: "var(--tb-navy-900)" }}
                data-testid="contact-email"
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--tb-gold)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--tb-navy-900)"; }}
              >
                <Mail size={18} strokeWidth={1.5} />
                <span>{email}</span>
              </a>
            </div>

            <div>
              <Link to="/contact" className="tb-btn-primary" data-testid="contact-cta">
                <span>{lang === "ar" ? "نموذج التواصل" : "Contact form"}</span>
                <Arrow size={16} strokeWidth={1.6} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

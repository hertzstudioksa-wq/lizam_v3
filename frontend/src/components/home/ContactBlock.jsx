import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function ContactBlock() {
  const { lang } = useLang();
  const { data: site } = useSiteSettings();
  const email = site?.contact_email || "info@lizam.sa";
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section id="contact" className="relative bg-ivory" data-testid="section-contact">
      <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 py-24 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-start">
          <div className="md:col-span-5">
            <div className="lz-eyebrow text-navy/70">
              {lang === "ar" ? "تواصل" : "Contact"}
            </div>
            <div className="mt-4 h-px w-12 bg-brass" />
            <h2 className="lz-h2 mt-8 max-w-[22ch]">
              {lang === "ar"
                ? "للتعاون البحثي والاستفسارات المؤسسية."
                : "For research collaboration and institutional enquiries."}
            </h2>
          </div>
          <div className="md:col-span-7 space-y-8">
            <p className="text-[15px] leading-[1.9] text-ink/75 max-w-[58ch]">
              {lang === "ar"
                ? "يرحّب المركز بالتواصل من المؤسسات الحكومية والخاصة وجمعيات القطاع غير الربحي، ومن الباحثين المهتمين بالتعاون البحثي أو الاستشاري."
                : "We welcome enquiries from government, private, and non-profit institutions, and from researchers interested in collaboration or advisory engagements."}
            </p>

            <div className="border-t border-rule pt-8">
              <div className="lz-eyebrow text-mute mb-3">
                {lang === "ar" ? "البريد الإلكتروني" : "Email"}
              </div>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-3 text-[20px] md:text-[22px] text-navy-deep hover:text-brass transition-colors duration-500 lz-linkline"
                style={{ fontFamily: '"Thmanyah Serif Display", serif' }}
                data-testid="contact-email"
              >
                <Mail size={18} strokeWidth={1.5} />
                <span>{email}</span>
              </a>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/contact" className="lz-btn-primary" data-testid="contact-cta">
                <span>{lang === "ar" ? "نموذج التواصل" : "Contact form"}</span>
                <Arrow size={16} strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

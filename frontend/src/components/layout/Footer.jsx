import { Link } from "react-router-dom";
import Logo from "@/components/brand/Logo";
import { useLang } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function Footer() {
  const { lang, t, pick } = useLang();
  const { data: site } = useSiteSettings();
  const year = new Date().getFullYear();
  const tagline = pick(site, "tagline", "");
  const contactEmail = site?.contact_email || "info@lizam.sa";
  const address = pick(site, "address", "");
  const footerTextTemplate = pick(site, "footer_text", "");
  const footerText = footerTextTemplate
    ? footerTextTemplate.replace("{year}", year)
    : lang === "ar"
    ? `© ${year} مركز لزام للدراسات القانونية. جميع الحقوق محفوظة.`
    : `© ${year} LIZAM Center for Legal Research. All rights reserved.`;

  return (
    <footer className="bg-navy-deep text-ivory/90" data-testid="site-footer">
      <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 pt-20 pb-10">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-5 space-y-6">
            <Logo variant="light" height={52} data-testid="footer-logo" />
            <p className="text-[14.5px] leading-[1.9] text-ivory/70 max-w-md">
              {tagline || t("footer.institutional")}
            </p>
            <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-brass">
              <span className="h-px w-6 bg-brass" />
              <span className={lang === "ar" ? "font-arabic tracking-normal" : ""}>
                {lang === "ar" ? "المملكة العربية السعودية" : "Kingdom of Saudi Arabia"}
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3">
            <h4 className="text-[12px] uppercase tracking-[0.22em] text-ivory/50 mb-5">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-3 text-[14.5px]">
              <li>
                <Link to="/" className="hover:text-brass transition-colors duration-300" data-testid="footer-home">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link to="/publications" className="hover:text-brass transition-colors duration-300" data-testid="footer-publications">
                  {t("nav.publications")}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brass transition-colors duration-300" data-testid="footer-about">
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brass transition-colors duration-300" data-testid="footer-contact">
                  {t("nav.contact")}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brass transition-colors duration-300" data-testid="footer-login">
                  {t("nav.login")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h4 className="text-[12px] uppercase tracking-[0.22em] text-ivory/50 mb-5">
              {t("footer.contactUs")}
            </h4>
            <ul className="space-y-3 text-[14.5px] text-ivory/80">
              {contactEmail && (
                <li>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="hover:text-brass transition-colors duration-300 lz-linkline"
                    data-testid="footer-email"
                  >
                    {contactEmail}
                  </a>
                </li>
              )}
              {address && <li className="text-ivory/60">{address}</li>}
            </ul>
          </div>
        </div>

        {/* Hairline */}
        <div className="h-px bg-ivory/10 my-10" />

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[12.5px] text-ivory/50">
          <span data-testid="footer-copyright">{footerText}</span>
          <div className="flex items-center gap-5">
            <Link to="/policy" className="hover:text-ivory/80 transition-colors">
              {t("footer.legal")}
            </Link>
            <span className="opacity-40">·</span>
            <Link to="/privacy" className="hover:text-ivory/80 transition-colors">
              {t("footer.privacy")}
            </Link>
            <span className="opacity-40">·</span>
            <Link to="/terms" className="hover:text-ivory/80 transition-colors">
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

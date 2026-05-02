import { Link } from "react-router-dom";
import Logo from "@/components/brand/Logo";
import { useLang } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Theme B — Premium Editorial Footer.
 * Deep navy ground with gold separators, institutional layout.
 */
export default function FooterB() {
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

  const linkCls = "text-[14px] transition-colors duration-400";
  const linkStyle = { color: "rgba(249, 247, 243, 0.78)" };

  return (
    <footer
      style={{ background: "var(--tb-navy-900)", color: "var(--tb-paper-base)" }}
      data-testid="site-footer"
      data-theme-component="theme-b-footer"
    >
      <div className="mx-auto max-w-[1360px] px-6 md:px-10 lg:px-14 pt-24 pb-12">
        {/* Masthead */}
        <div className="flex items-center gap-4 mb-12">
          <span style={{ height: 1, width: 56, background: "var(--tb-gold)" }} />
          <span
            className="text-[11px] font-semibold"
            style={{ color: "var(--tb-gold)", letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            {lang === "ar" ? "المركز البحثي" : "The Research Center"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10">
          {/* Brand */}
          <div className="md:col-span-5 space-y-6">
            <Logo variant="light" height={56} data-testid="footer-logo" />
            <p
              className="text-[15px] leading-[1.95] max-w-md"
              style={{ color: "rgba(249, 247, 243, 0.7)" }}
            >
              {tagline || t("footer.institutional")}
            </p>
            <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.18em]" style={{ color: "var(--tb-gold-soft)" }}>
              <span style={{ height: 1, width: 28, background: "var(--tb-gold)" }} />
              <span className={lang === "ar" ? "tracking-normal" : ""}>
                {lang === "ar" ? "المملكة العربية السعودية" : "Kingdom of Saudi Arabia"}
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3">
            <h4
              className="text-[11px] uppercase tracking-[0.24em] mb-6"
              style={{ color: "var(--tb-gold-soft)" }}
            >
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-4">
              <li><Link to="/" className={linkCls} style={linkStyle} data-testid="footer-home">{t("nav.home")}</Link></li>
              <li><Link to="/publications" className={linkCls} style={linkStyle} data-testid="footer-publications">{t("nav.publications")}</Link></li>
              <li><Link to="/about" className={linkCls} style={linkStyle} data-testid="footer-about">{t("nav.about")}</Link></li>
              <li><Link to="/contact" className={linkCls} style={linkStyle} data-testid="footer-contact">{t("nav.contact")}</Link></li>
              <li><Link to="/login" className={linkCls} style={linkStyle} data-testid="footer-login">{t("nav.login")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h4
              className="text-[11px] uppercase tracking-[0.24em] mb-6"
              style={{ color: "var(--tb-gold-soft)" }}
            >
              {t("footer.contactUs")}
            </h4>
            <ul className="space-y-4">
              {contactEmail && (
                <li>
                  <a
                    href={`mailto:${contactEmail}`}
                    className={linkCls}
                    style={linkStyle}
                    data-testid="footer-email"
                  >
                    {contactEmail}
                  </a>
                </li>
              )}
              {address && (
                <li className="text-[14px]" style={{ color: "rgba(249, 247, 243, 0.55)" }}>
                  {address}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Hairline */}
        <div style={{ height: 1, background: "rgba(212, 185, 130, 0.22)", margin: "3.5rem 0 2rem" }} />

        {/* Bottom */}
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[12.5px]"
          style={{ color: "rgba(249, 247, 243, 0.5)" }}
        >
          <span data-testid="footer-copyright">{footerText}</span>
          <div className="flex items-center gap-5">
            <Link to="/policy" className="hover:text-[var(--tb-gold-soft)] transition-colors duration-400">{t("footer.legal")}</Link>
            <span style={{ width: 8, height: 1, background: "var(--tb-gold)", display: "inline-block" }} />
            <Link to="/privacy" className="hover:text-[var(--tb-gold-soft)] transition-colors duration-400">{t("footer.privacy")}</Link>
            <span style={{ width: 8, height: 1, background: "var(--tb-gold)", display: "inline-block" }} />
            <Link to="/terms" className="hover:text-[var(--tb-gold-soft)] transition-colors duration-400">{t("footer.terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

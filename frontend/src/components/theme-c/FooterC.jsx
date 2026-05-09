import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Twitter, Linkedin, Youtube, Mail } from "lucide-react";

export default function FooterC() {
  const { lang, t } = useLang();
  const { data } = useSiteSettings();
  const social = data?.social_links || {};
  const tagline = lang === "ar" ? data?.tagline_ar : data?.tagline_en;
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative pt-24 pb-10"
      style={{ background: "var(--tc-navy-dark)", color: "var(--tc-ivory)" }}
      data-testid="site-footer"
      data-theme-component="theme-c-footer"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
          {/* Brand block */}
          <div className="md:col-span-6">
            <div className="tc-eyebrow-light">{lang === "ar" ? "مركز لزام" : "LIZAM Center"}</div>
            <h2
              className="mt-5 text-4xl md:text-5xl lg:text-6xl leading-[1.1] font-semibold"
              style={{ fontFamily: lang === "ar" ? 'var(--lz-font-ar, "Thmanyah Serif Display"), serif' : '"Source Serif 4", serif' }}
              data-testid="footer-brand"
            >
              {lang === "ar" ? "بحث قانوني رصين" : "Rigorous legal research"}
            </h2>
            {tagline && (
              <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "rgba(248,247,243,0.62)" }}>
                {tagline}
              </p>
            )}
            <div className="mt-8 flex items-center gap-5">
              {social.twitter && <a href={social.twitter} target="_blank" rel="noreferrer" className="tc-social-icon" aria-label="Twitter"><Twitter size={18} /></a>}
              {social.linkedin && <a href={social.linkedin} target="_blank" rel="noreferrer" className="tc-social-icon" aria-label="LinkedIn"><Linkedin size={18} /></a>}
              {social.youtube && <a href={social.youtube} target="_blank" rel="noreferrer" className="tc-social-icon" aria-label="YouTube"><Youtube size={18} /></a>}
              {data?.contact_email && (
                <a href={`mailto:${data.contact_email}`} className="tc-social-icon" aria-label="Email"><Mail size={18} /></a>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3">
            <div className="tc-eyebrow-light">{t("footer.quickLinks")}</div>
            <ul className="mt-5 space-y-3 text-[14px]" style={{ color: "rgba(248,247,243,0.78)" }}>
              <li><Link to="/" className="hover:text-[var(--tc-gold)] transition-colors">{t("nav.home")}</Link></li>
              <li><Link to="/publications" className="hover:text-[var(--tc-gold)] transition-colors">{t("nav.publications")}</Link></li>
              <li><Link to="/about" className="hover:text-[var(--tc-gold)] transition-colors">{t("nav.about")}</Link></li>
              <li><Link to="/contact" className="hover:text-[var(--tc-gold)] transition-colors">{t("nav.contact")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <div className="tc-eyebrow-light">{t("footer.contactUs")}</div>
            <ul className="mt-5 space-y-3 text-[14px]" style={{ color: "rgba(248,247,243,0.78)" }}>
              {data?.contact_email && <li>{data.contact_email}</li>}
              {data?.phone && <li dir="ltr" className="tabular-nums">{data.phone}</li>}
              {(lang === "ar" ? data?.address_ar : data?.address_en) && (
                <li className="leading-relaxed">{lang === "ar" ? data?.address_ar : data?.address_en}</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-20 pt-6 flex flex-wrap gap-4 items-center justify-between" style={{ borderTop: "1px solid rgba(248,247,243,0.08)" }}>
          <span className="text-[12px] tracking-[0.12em]" style={{ color: "rgba(248,247,243,0.45)" }}>
            © {year} {lang === "ar" ? "مركز لزام للدراسات القانونية. جميع الحقوق محفوظة." : "LIZAM Center for Legal Research. All rights reserved."}
          </span>
          <span className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "var(--tc-gold)" }}>
            {lang === "ar" ? "المملكة العربية السعودية" : "Kingdom of Saudi Arabia"}
          </span>
        </div>
      </div>

      <style>{`
        .tc-social-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 36px; height: 36px;
          border: 1px solid rgba(248,247,243,0.18);
          color: rgba(248,247,243,0.7);
          transition: border-color 220ms ease, color 220ms ease, background 220ms ease;
        }
        .tc-social-icon:hover { border-color: var(--tc-gold); color: var(--tc-gold); background: rgba(197,160,89,0.08); }
      `}</style>
    </footer>
  );
}

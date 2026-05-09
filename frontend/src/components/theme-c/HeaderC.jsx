import { NavLink, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";

const ADMIN_ROLES = new Set(["super_admin", "admin", "editor", "reviewer"]);

const navItems = (t) => [
  { to: "/", label: t("nav.home"), testid: "nav-home" },
  { to: "/publications", label: t("nav.publications"), testid: "nav-publications" },
  { to: "/about", label: t("nav.about"), testid: "nav-about" },
  { to: "/contact", label: t("nav.contact"), testid: "nav-contact" },
];

/**
 * Theme C — glass-morphism crystal header.
 * Sits over a dark cinematic hero by default; on scroll past 80px swaps
 * to the on-light variant for the rest of the page.
 */
export default function HeaderC() {
  const { lang, toggle, t } = useLang();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const items = navItems(t);
  const isAuthed = user && typeof user === "object";
  const isAdmin = isAuthed && ADMIN_ROLES.has(user.role);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 tc-glass-header ${scrolled ? "tc-on-light" : ""}`}
      data-testid="site-header"
      data-theme-component="theme-c-header"
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14">
        <div className="flex items-center justify-between h-[68px] md:h-[78px]">
          {/* Brand mark — minimal lockup */}
          <Link to="/" className="inline-flex items-center gap-3" data-testid="header-logo">
            <span
              className="block w-1.5 h-1.5"
              style={{ background: "var(--tc-gold)" }}
            />
            <span
              className={`tracking-[0.18em] uppercase text-[12.5px] font-semibold ${scrolled ? "text-[var(--tc-navy)]" : "text-[var(--tc-ivory)]"}`}
              style={{ fontFamily: '"Source Serif 4", Georgia, serif', letterSpacing: "0.22em" }}
            >
              LIZAM
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-9" data-testid="desktop-nav">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === "/"}
                data-testid={it.testid}
                className={({ isActive }) => `tc-nav-link ${isActive ? "active" : ""}`}
              >
                {it.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              className={`tc-nav-link inline-flex items-center gap-1`}
              aria-label="Switch language"
              data-testid="language-switch"
            >
              <span style={{ color: "var(--tc-gold)" }}>{t("lang.switch")}</span>
            </button>
            {isAdmin && (
              <Link
                to="/admin"
                className="tc-nav-link inline-flex items-center gap-1.5"
                data-testid="admin-entry-btn"
                title={t("nav.admin")}
              >
                <LayoutDashboard size={14} strokeWidth={1.6} />
                <span>{t("nav.admin")}</span>
              </Link>
            )}
            {isAuthed ? (
              <Link to="/account" className="tc-nav-link" data-testid="account-btn">
                {t("nav.account")}
              </Link>
            ) : (
              <Link to="/login" className="tc-nav-link" data-testid="login-btn">
                {t("nav.login")}
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden h-11 w-11 inline-flex items-center justify-center"
            style={{ color: scrolled ? "var(--tc-navy)" : "var(--tc-ivory)" }}
            aria-label={open ? "Close menu" : "Open menu"}
            data-testid="mobile-menu-toggle"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 top-[68px] z-40 overflow-y-auto"
          style={{ background: "var(--tc-navy-dark)" }}
          data-testid="mobile-nav"
        >
          <div className="px-6 pt-12 pb-16 max-w-[600px] mx-auto">
            <div className="tc-eyebrow-light mb-8">{lang === "ar" ? "القائمة" : "Menu"}</div>
            <nav className="flex flex-col">
              {items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block py-5 text-[28px] font-semibold transition-colors ${isActive ? "text-[var(--tc-gold)]" : "text-[var(--tc-ivory)]"}`
                  }
                  style={{ fontFamily: '"Thmanyah Serif Display", "Source Serif 4", serif', borderBottom: "1px solid rgba(248,247,243,0.08)" }}
                  data-testid={`${it.testid}-mobile`}
                >
                  {it.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-10 flex items-center justify-between gap-3">
              <button type="button" onClick={toggle} className="tc-btn-ghost-light" data-testid="language-switch-mobile">
                {t("lang.switch")}
              </button>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="tc-btn-ghost-light"
                  onClick={() => setOpen(false)}
                  data-testid="admin-entry-btn-mobile"
                >
                  <LayoutDashboard size={14} />
                  <span>{t("nav.admin")}</span>
                </Link>
              )}
              {isAuthed ? (
                <Link to="/account" className="tc-btn-primary" onClick={() => setOpen(false)}>
                  {t("nav.account")}
                </Link>
              ) : (
                <Link to="/login" className="tc-btn-primary" onClick={() => setOpen(false)}>
                  {t("nav.login")}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

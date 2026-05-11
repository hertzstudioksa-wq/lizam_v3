import { NavLink, Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Menu, X, LayoutDashboard } from "lucide-react";
import Logo from "@/components/brand/Logo";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const ADMIN_ROLES = new Set(["super_admin", "admin", "editor", "reviewer"]);

// Routes that render a dark, full-bleed hero behind the (transparent) header.
// On every other route the header must be in "solid" mode from the first paint
// otherwise its paper-coloured links are invisible against the paper page bg.
const DARK_HERO_ROUTES = new Set(["/", "/publications", "/about", "/contact"]);

const NAV_DEFS = (t) => ({
  home:         { to: "/",             label: t("nav.home"),         testid: "nav-home" },
  publications: { to: "/publications", label: t("nav.publications"), testid: "nav-publications" },
  about:        { to: "/about",        label: t("nav.about"),        testid: "nav-about" },
  contact:      { to: "/contact",      label: t("nav.contact"),      testid: "nav-contact" },
});
const DEFAULT_ORDER = ["home", "publications", "about", "contact"];

/**
 * Theme B — Premium Editorial Header.
 * Crisp paper background with hairline rule, gold underline reveal on hover,
 * full-screen ivory mobile overlay with display-serif links.
 */
export default function HeaderB() {
  const { lang, toggle, t } = useLang();
  const { user } = useAuth();
  const { data: site } = useSiteSettings();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // On any non-hero page the header must paint solid from the start.
  const overDarkHero = DARK_HERO_ROUTES.has(pathname);
  const solid = scrolled || !overDarkHero;

  useEffect(() => {
    // Threshold raised to 80px per design spec — gives a clear "I've scrolled
    // into content" beat before the header solidifies.
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const items = useMemo(() => {
    const defs = NAV_DEFS(t);
    const order = (site?.header_nav_order && site.header_nav_order.length)
      ? site.header_nav_order
      : DEFAULT_ORDER;
    return order.map((k) => defs[k]).filter(Boolean);
  }, [t, site?.header_nav_order]);
  const isAuthed = user && typeof user === "object";
  const isAdmin = isAuthed && ADMIN_ROLES.has(user.role);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300`}
      style={{
        background: solid
          ? (scrolled ? "rgba(10, 17, 28, 0.86)" : "rgba(249, 247, 243, 0.92)")
          : "transparent",
        backdropFilter: solid ? "blur(8px)" : "none",
        WebkitBackdropFilter: solid ? "blur(8px)" : "none",
        borderBottom: solid ? "1px solid var(--tb-hairline-soft)" : "1px solid transparent",
        boxShadow: scrolled ? "0 6px 24px rgba(10, 17, 28, 0.18)" : "none",
        // Foreground colors: when scrolled-past-80 (dark navy bg) use paper text,
        // when solid-on-paper (non-hero routes) use navy text,
        // when over dark hero use paper text.
        ["--tb-header-fg"]: scrolled
          ? "var(--tb-paper-base)"
          : (solid ? "var(--tb-navy-900)" : "var(--tb-paper-base)"),
        ["--tb-header-fg-muted"]: scrolled
          ? "rgba(251, 250, 247, 0.78)"
          : (solid ? "var(--tb-text-muted)" : "rgba(251, 250, 247, 0.78)"),
        color: scrolled
          ? "var(--tb-paper-base)"
          : (solid ? "var(--tb-navy-900)" : "var(--tb-paper-base)"),
      }}
      data-testid="site-header"
      data-theme-component="theme-b-header"
      data-scrolled={scrolled ? "true" : "false"}
      data-solid={solid ? "true" : "false"}
    >
      <div className="mx-auto max-w-[1360px] px-5 md:px-10 lg:px-14">
        <div className="flex items-center justify-between h-[72px] md:h-[82px]">
          <Logo height={44} variant={(solid && !scrolled) ? "default" : "light"} data-testid="header-logo" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-10" data-testid="desktop-nav">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === "/"}
                data-testid={it.testid}
                className={({ isActive }) => `tb-nav-link ${isActive ? "active" : ""}`}
                style={{ color: "var(--tb-header-fg)" }}
              >
                {it.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              className="tb-btn-ghost"
              aria-label="Switch language"
              data-testid="language-switch"
              style={{ color: "var(--tb-header-fg)" }}
            >
              <span className={lang === "ar" ? "font-sans" : "font-arabic"}>
                {t("lang.switch")}
              </span>
            </button>
            {isAdmin && (
              <Link
                to="/admin"
                className="tb-btn-ghost inline-flex items-center gap-1.5"
                data-testid="admin-entry-btn"
                title={t("nav.admin")}
                style={{ color: "var(--tb-header-fg)" }}
              >
                <LayoutDashboard size={14} strokeWidth={1.8} />
                <span>{t("nav.admin")}</span>
              </Link>
            )}
            {isAuthed ? (
              <Link to="/account" className="tb-btn-secondary text-[13px] py-2 px-4" data-testid="account-btn">
                {t("nav.account")}
              </Link>
            ) : (
              <Link to="/login" className="tb-btn-secondary text-[13px] py-2 px-4" data-testid="login-btn">
                {t("nav.login")}
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden h-11 w-11 inline-flex items-center justify-center"
            style={{ color: solid ? "var(--tb-navy-900)" : "var(--tb-paper-base)" }}
            aria-label={open ? "Close menu" : "Open menu"}
            data-testid="mobile-menu-toggle"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile full-screen overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 top-[72px] tb-mobile-overlay z-40 overflow-y-auto"
          data-testid="mobile-nav"
        >
          <div className="px-6 pt-10 pb-16 max-w-[600px] mx-auto">
            <div className="tb-section-eyebrow mb-8">
              <span className="rule" />
              <span className="tb-overline">{lang === "ar" ? "القائمة" : "Menu"}</span>
            </div>
            <nav className="flex flex-col">
              {items.map((it, i) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.to === "/"}
                  onClick={() => setOpen(false)}
                  className="tb-mobile-link tb-rise"
                  style={{ animationDelay: `${i * 80}ms` }}
                  data-testid={`${it.testid}-mobile`}
                >
                  {it.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-10 flex items-center justify-between">
              <button
                type="button"
                onClick={toggle}
                className="tb-btn-ghost"
                data-testid="language-switch-mobile"
              >
                {t("lang.switch")}
              </button>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="tb-btn-ghost inline-flex items-center gap-1.5"
                  onClick={() => setOpen(false)}
                  data-testid="admin-entry-btn-mobile"
                >
                  <LayoutDashboard size={14} strokeWidth={1.8} />
                  <span>{t("nav.admin")}</span>
                </Link>
              )}
              {isAuthed ? (
                <Link to="/account" className="tb-btn-secondary text-[13px] py-2 px-4" onClick={() => setOpen(false)}>
                  {t("nav.account")}
                </Link>
              ) : (
                <Link to="/login" className="tb-btn-secondary text-[13px] py-2 px-4" onClick={() => setOpen(false)}>
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

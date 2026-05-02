import { NavLink, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/components/brand/Logo";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";

const navItems = (t) => [
  { to: "/", label: t("nav.home"), testid: "nav-home" },
  { to: "/publications", label: t("nav.publications"), testid: "nav-publications" },
  { to: "/about", label: t("nav.about"), testid: "nav-about" },
  { to: "/contact", label: t("nav.contact"), testid: "nav-contact" },
];

export default function Header() {
  const { lang, toggle, t } = useLang();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items = navItems(t);
  const isAuthed = user && typeof user === "object";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background,backdrop-filter,border] duration-500 ease-institute ${
        scrolled
          ? "bg-ivory/92 backdrop-blur-md border-b border-rule"
          : "bg-transparent border-b border-transparent"
      }`}
      data-testid="site-header"
    >
      <div className="mx-auto max-w-[1360px] px-5 md:px-10 lg:px-14">
        <div className="flex items-center justify-between h-[70px] md:h-[78px]">
          <Logo height={44} data-testid="header-logo" />

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-9 text-[14.5px] text-ink/75"
            data-testid="desktop-nav"
          >
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === "/"}
                data-testid={it.testid}
                className={({ isActive }) =>
                  `lz-linkline transition-colors duration-300 ${
                    isActive ? "text-navy-deep" : "hover:text-navy-deep"
                  }`
                }
              >
                {it.label}
              </NavLink>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggle}
              className="inline-flex items-center justify-center h-9 min-w-[40px] px-2.5 text-[13px] font-medium text-ink/70 hover:text-navy-deep border border-rule hover:border-navy/40 transition-colors duration-300"
              style={{ borderRadius: 1 }}
              aria-label="Switch language"
              data-testid="language-switch"
            >
              <span className={lang === "ar" ? "font-sans" : "font-arabic"}>
                {t("lang.switch")}
              </span>
            </button>

            {isAuthed ? (
              <Link
                to="/account"
                className="lz-btn-ghost h-9 px-4 text-[13px]"
                data-testid="account-btn"
              >
                {t("nav.account")}
              </Link>
            ) : (
              <Link
                to="/login"
                className="lz-btn-ghost h-9 px-4 text-[13px]"
                data-testid="login-btn"
              >
                {t("nav.login")}
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden h-10 w-10 inline-flex items-center justify-center text-ink"
            aria-label={open ? "Close menu" : "Open menu"}
            data-testid="mobile-menu-toggle"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="md:hidden border-t border-rule bg-ivory"
          data-testid="mobile-nav"
        >
          <nav className="mx-auto max-w-[1360px] px-5 py-6 flex flex-col gap-5 text-[15px]">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `text-ink/80 ${isActive ? "text-navy-deep font-medium" : ""}`
                }
                data-testid={`${it.testid}-mobile`}
              >
                {it.label}
              </NavLink>
            ))}
            <div className="h-px bg-rule my-1" />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={toggle}
                className="inline-flex items-center gap-2 text-[13px] text-ink/70"
                data-testid="language-switch-mobile"
              >
                {t("lang.switch")}
              </button>
              {isAuthed ? (
                <Link to="/account" className="lz-btn-ghost h-9 px-4 text-[13px]" onClick={() => setOpen(false)}>
                  {t("nav.account")}
                </Link>
              ) : (
                <Link to="/login" className="lz-btn-ghost h-9 px-4 text-[13px]" onClick={() => setOpen(false)}>
                  {t("nav.login")}
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

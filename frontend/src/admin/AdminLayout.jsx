import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LogOut, LayoutDashboard, FileText, Users, Palette, Settings,
  BookOpen, MessageSquare, Mail, ShieldCheck, Tag,
  Activity, Home, Phone, ChevronDown, LayoutList, PanelTop, Newspaper,
} from "lucide-react";
import Logo from "@/components/brand/Logo";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { api } from "@/lib/api";

const ADMIN_ROLES = new Set(["super_admin", "admin", "editor", "reviewer"]);

const NAV_GROUPS = (lang) => {
  const ar = lang === "ar";
  return [
    {
      key: "general",
      label: null, // no label for first group
      items: [
        { key: "overview", to: "/admin", icon: LayoutDashboard, label: ar ? "نظرة عامة" : "Overview", end: true },
      ],
    },
    {
      key: "content",
      label: ar ? "المحتوى" : "Content",
      color: "#B89B5E", // gold — brand primary
      items: [
        { key: "publications", to: "/admin/publications", icon: FileText,  label: ar ? "الإصدارات" : "Publications" },
        { key: "news",         to: "/admin/news",         icon: Newspaper, label: ar ? "الأخبار والفعاليات" : "News & Events" },
        { key: "authors",      to: "/admin/authors",      icon: Users,     label: ar ? "الباحثون" : "Researchers" },
        { key: "categories",   to: "/admin/categories",   icon: Tag,       label: ar ? "مجالات العمل" : "Categories" },
      ],
    },
    {
      key: "pages",
      label: ar ? "الصفحات" : "Pages",
      color: "#7FA8C9", // dusty blue
      items: [
        { key: "home",             to: "/admin/home",             icon: Home,       label: ar ? "الصفحة الرئيسية" : "Home" },
        { key: "about",            to: "/admin/about",            icon: BookOpen,   label: ar ? "صفحة عن المركز" : "About" },
        { key: "publicationsPage", to: "/admin/publications-page", icon: FileText,  label: ar ? "صفحة الإصدارات" : "Publications" },
        { key: "contact",          to: "/admin/contact",          icon: Phone,      label: ar ? "صفحة التواصل" : "Contact" },
        { key: "activitiesPage",   to: "/admin/activities-page",  icon: Newspaper,  label: ar ? "الأنشطة" : "Activities" },
        { key: "fellowsPage",      to: "/admin/fellows-page",     icon: Users,      label: ar ? "زملاء لزام" : "LIZAM Fellows" },
      ],
    },
    {
      key: "communication",
      label: ar ? "التواصل" : "Communication",
      color: "#7BA08A", // sage green
      items: [
        { key: "messages",    to: "/admin/messages",    icon: Mail,          label: ar ? "الرسائل" : "Messages" },
        { key: "responses",   to: "/admin/responses",   icon: MessageSquare, label: ar ? "الردود البحثية" : "Responses" },
        { key: "newsletter",  to: "/admin/newsletter",  icon: Mail,          label: ar ? "النشرة البريدية" : "Newsletter" },
      ],
    },
    {
      key: "design",
      label: ar ? "التصميم والإعدادات" : "Design & Settings",
      color: "#9B8ABF", // soft purple
      items: [
        { key: "allSections",      to: "/admin/all-sections",     icon: PanelTop,   label: ar ? "✦ الأقسام" : "✦ All Sections" },
        { key: "pagesManager",     to: "/admin/pages",            icon: LayoutList, label: ar ? "مدير الصفحات" : "Pages Manager" },
        { key: "branding",        to: "/admin/branding",         icon: Palette,   label: ar ? "الهوية والتصميم" : "Branding" },
        { key: "settings",        to: "/admin/settings",         icon: Settings,  label: ar ? "إعدادات الموقع" : "Site Settings" },
      ],
    },
    {
      key: "admin",
      label: ar ? "الإدارة" : "Administration",
      color: "#C47878", // muted coral
      items: [
        { key: "users", to: "/admin/users", icon: ShieldCheck, label: ar ? "المستخدمون والصلاحيات" : "Users & Permissions" },
        { key: "audit", to: "/admin/audit", icon: Activity,    label: ar ? "سجل النشاط" : "Audit Log" },
      ],
    },
  ];
};

export default function AdminLayout() {
  const { user, bootstrapping, logout } = useAuth();
  const { lang, t, toggle } = useLang();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [customPages, setCustomPages] = useState([]);

  useEffect(() => {
    if (user && typeof user === "object" && ADMIN_ROLES.has(user.role)) {
      api.get("/admin/overview").then(({ data }) => setOverview(data)).catch(() => {});
      // Fetch custom pages to show them in sidebar
      api.get("/admin/custom-pages").then(({ data }) => setCustomPages(data.items || [])).catch(() => {});
    }
  }, [user]);

  const toggleGroup = (key) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center text-mute" data-testid="admin-bootstrapping">
        {t("common.loading")}
      </div>
    );
  }
  if (!user || typeof user !== "object") {
    return <Navigate to="/login" replace state={{ from: { pathname: "/admin" } }} />;
  }
  if (!ADMIN_ROLES.has(user.role)) {
    return <Navigate to="/" replace />;
  }

  const ar = lang === "ar";
  // Build groups with custom pages injected into the pages group
  const groups = NAV_GROUPS(lang).map(group => {
    if (group.key !== "pages") return group;
    // Add custom pages after the static page items
    const customItems = customPages.map(cp => ({
      key: `custom-${cp.id}`,
      to: `/admin/pages/${cp.id}`,
      icon: LayoutList,
      label: ar ? (cp.title_ar || cp.title_en) : (cp.title_en || cp.title_ar),
      testid: `admin-nav-custom-${cp.slug}`,
    }));
    return { ...group, items: [...group.items, ...customItems] };
  });

  return (
    <div className="bg-paper flex" data-testid="admin-layout">
      {/* Sidebar — fixed to viewport, independent scroll */}
      <aside className="fixed top-0 start-0 bottom-0 w-[260px] bg-navy-deep text-ivory flex flex-col z-40">

        {/* Logo */}
        <div className="px-6 py-6 border-b border-ivory/10">
          <Logo variant="light" height={36} data-testid="admin-logo" />
          <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-ivory/50">
            {t("admin.title")}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto lz-scrollbar" data-testid="admin-sidebar-nav">
          {groups.map((group) => {
            const isCollapsed = collapsed[group.key];
            const accent = group.color || "#B89B5E";
            return (
              <div key={group.key} className="mb-1">

                {/* Group label */}
                {group.label && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between px-4 py-1.5 mt-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: accent }}
                      />
                      <span
                        className="text-[10px] uppercase tracking-[0.2em] font-medium"
                        style={{ color: accent, opacity: 0.85 }}
                      >
                        {group.label}
                      </span>
                    </div>
                    <ChevronDown
                      size={10}
                      strokeWidth={2.5}
                      style={{ color: accent, opacity: 0.6 }}
                      className={`transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                    />
                  </button>
                )}

                {/* Items */}
                {!isCollapsed && (
                  <div className="px-2 mt-0.5 space-y-0.5">
                    {group.items.map(({ key, to, icon: Icon, label, end }) => (
                      <NavLink
                        key={key}
                        to={to}
                        end={end}
                        data-testid={`admin-nav-${key}`}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 h-9 text-[13px] transition-colors duration-200 ${
                            isActive
                              ? "text-ivory bg-ivory/10"
                              : "text-ivory/55 hover:text-ivory hover:bg-ivory/5"
                          }`
                        }
                        style={({ isActive }) => isActive ? { borderInlineStart: `2px solid ${accent}`, paddingInlineStart: "10px" } : {}}
                      >
                        <Icon size={14} strokeWidth={1.6} className="shrink-0" style={{ color: "inherit" }} />
                        <span className="truncate">{label}</span>
                        {key === "messages"  && overview?.messages_new   > 0 && <Badge count={overview.messages_new}   color={accent} />}
                        {key === "responses" && overview?.responses_pending > 0 && <Badge count={overview.responses_pending} color={accent} />}
                      </NavLink>
                    ))}
                  </div>
                )}

                {/* Subtle separator after each group */}
                {group.label && !isCollapsed && (
                  <div className="mx-4 mt-2" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
                )}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-ivory/10 space-y-2">
          <div className="text-[11px] uppercase tracking-[0.2em] text-ivory/40 truncate">{user.name}</div>
          <div className="text-[12.5px] text-ivory/65 truncate">{user.email}</div>
          <div className="text-[10.5px] text-brass uppercase tracking-[0.14em]">{user.role}</div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={toggle}
              className="h-8 px-2 text-[12px] border border-ivory/20 text-ivory/70 hover:text-ivory hover:border-ivory/40 transition-colors"
              data-testid="admin-lang-switch"
            >
              {t("lang.switch")}
            </button>
            <button
              type="button"
              onClick={async () => { await logout(); navigate("/"); }}
              className="flex-1 h-8 inline-flex items-center justify-center gap-1.5 text-[12px] border border-ivory/20 text-ivory/70 hover:text-ivory hover:border-ivory/40 transition-colors"
              data-testid="admin-logout"
            >
              <LogOut size={13} />
              <span>{t("nav.logout")}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content — offset by sidebar width */}
      <main className="flex-1 min-w-0 min-h-screen ms-[260px]" data-testid="admin-main">
        <Outlet context={{ overview, user }} />
      </main>
    </div>
  );
}

function Badge({ count, color = "#B89B5E" }) {
  return (
    <span
      className="ms-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center"
      style={{ background: color, color: "#0A111C" }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

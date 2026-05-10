import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { LogOut, LayoutDashboard, FileText, Users, Palette, Settings, BookOpen, MessageSquare, ToggleLeft, Mail, ShieldCheck, Tag, Image as ImageIcon, Activity, GripVertical, RotateCcw } from "lucide-react";
import Logo from "@/components/brand/Logo";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { api } from "@/lib/api";
import useAdminNavOrder from "@/admin/hooks/useAdminNavOrder";

const ADMIN_ROLES = new Set(["super_admin", "admin", "editor", "reviewer"]);

const NAV_DEFS = (lang) => ({
  overview:     { to: "/admin",              icon: LayoutDashboard, label: lang === "ar" ? "نظرة عامة" : "Overview", end: true, testid: "admin-nav-overview" },
  publications: { to: "/admin/publications", icon: FileText,        label: lang === "ar" ? "الإصدارات" : "Publications", testid: "admin-nav-publications" },
  authors:      { to: "/admin/authors",      icon: Users,           label: lang === "ar" ? "الباحثون" : "Researchers", testid: "admin-nav-authors" },
  categories:   { to: "/admin/categories",   icon: Tag,             label: lang === "ar" ? "مجالات العمل" : "Categories", testid: "admin-nav-categories" },
  responses:    { to: "/admin/responses",    icon: MessageSquare,   label: lang === "ar" ? "الردود البحثية" : "Responses", testid: "admin-nav-responses" },
  users:        { to: "/admin/users",        icon: ShieldCheck,     label: lang === "ar" ? "المستخدمون" : "Users", testid: "admin-nav-users" },
  roles:        { to: "/admin/roles",        icon: ShieldCheck,     label: lang === "ar" ? "الأدوار والصلاحيات" : "Roles & Permissions", testid: "admin-nav-roles" },
  messages:     { to: "/admin/messages",     icon: Mail,            label: lang === "ar" ? "الرسائل" : "Messages", testid: "admin-nav-messages" },
  home:         { to: "/admin/home",         icon: BookOpen,        label: lang === "ar" ? "محتوى الرئيسية" : "Home Content", testid: "admin-nav-home" },
  branding:     { to: "/admin/branding",     icon: Palette,         label: lang === "ar" ? "الهوية والتصميم" : "Branding & Design", testid: "admin-nav-branding" },
  images:       { to: "/admin/images",       icon: ImageIcon,       label: lang === "ar" ? "إدارة الصور" : "Image Management", testid: "admin-nav-images" },
  settings:     { to: "/admin/settings",     icon: Settings,        label: lang === "ar" ? "إعدادات الموقع" : "Site Settings", testid: "admin-nav-settings" },
  toggles:      { to: "/admin/toggles",      icon: ToggleLeft,      label: lang === "ar" ? "مفاتيح الميزات" : "Feature Toggles", testid: "admin-nav-toggles" },
  audit:        { to: "/admin/audit",        icon: Activity,        label: lang === "ar" ? "سجل النشاط" : "Audit Log", testid: "admin-nav-audit" },
});
const DEFAULT_NAV_KEYS = ["overview","publications","authors","categories","responses","users","roles","messages","home","branding","images","settings","toggles","audit"];

export default function AdminLayout() {
  const { user, bootstrapping, logout } = useAuth();
  const { lang, t, toggle } = useLang();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [dragKey, setDragKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const { orderedKeys, setOrder, reset, isCustom } = useAdminNavOrder(DEFAULT_NAV_KEYS);
  const defs = useMemo(() => NAV_DEFS(lang), [lang]);

  useEffect(() => {
    if (user && typeof user === "object" && ADMIN_ROLES.has(user.role)) {
      api.get("/admin/overview").then(({ data }) => setOverview(data)).catch(() => {});
    }
  }, [user]);

  function onDragStart(key, e) {
    setDragKey(key);
    try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", key); } catch { /* ignore */ }
  }
  function onDragOver(key, e) {
    e.preventDefault();
    if (key !== dragOverKey) setDragOverKey(key);
    try { e.dataTransfer.dropEffect = "move"; } catch { /* ignore */ }
  }
  function onDrop(targetKey, e) {
    e.preventDefault();
    const sourceKey = dragKey || (e.dataTransfer && e.dataTransfer.getData("text/plain"));
    setDragKey(null);
    setDragOverKey(null);
    if (!sourceKey || sourceKey === targetKey) return;
    const next = [...orderedKeys];
    const from = next.indexOf(sourceKey);
    const to = next.indexOf(targetKey);
    if (from < 0 || to < 0) return;
    next.splice(from, 1);
    next.splice(to, 0, sourceKey);
    setOrder(next);
  }
  function onDragEnd() { setDragKey(null); setDragOverKey(null); }

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

  return (
    <div className="min-h-screen bg-paper flex" data-testid="admin-layout">
      {/* Sidebar */}
      <aside className="w-[260px] min-h-screen bg-navy-deep text-ivory flex flex-col">
        <div className="px-6 py-6 border-b border-ivory/10">
          <Logo variant="light" height={36} data-testid="admin-logo" />
          <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-ivory/50">
            {t("admin.title")}
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto lz-scrollbar" data-testid="admin-sidebar-nav">
          {orderedKeys.map((key) => {
            const it = defs[key];
            if (!it) return null;
            const Icon = it.icon;
            const isDragging = dragKey === key;
            const isOver = dragOverKey === key && dragKey && dragKey !== key;
            return (
              <div
                key={key}
                draggable
                onDragStart={(e) => onDragStart(key, e)}
                onDragOver={(e) => onDragOver(key, e)}
                onDrop={(e) => onDrop(key, e)}
                onDragEnd={onDragEnd}
                onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                className={`relative ${isDragging ? "opacity-40" : ""} ${isOver ? "bg-brass/10 border-y border-brass/40" : ""}`}
                data-testid={`admin-nav-row-${key}`}
              >
                <NavLink
                  to={it.to}
                  end={it.end}
                  className={({ isActive }) =>
                    `group flex items-center gap-2 ps-2 pe-3 h-10 text-[13.5px] transition-colors duration-300 ${
                      isActive
                        ? "bg-ivory/10 text-ivory border-s-2 border-brass ps-[6px]"
                        : "text-ivory/65 hover:text-ivory hover:bg-ivory/5"
                    }`
                  }
                  data-testid={it.testid}
                >
                  <span
                    className="inline-flex items-center justify-center w-4 h-6 text-ivory/30 group-hover:text-ivory/70 cursor-grab active:cursor-grabbing"
                    aria-hidden="true"
                    title={lang === "ar" ? "اسحب لإعادة الترتيب" : "Drag to reorder"}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <GripVertical size={13} strokeWidth={1.6} />
                  </span>
                  <Icon size={16} strokeWidth={1.6} />
                  <span className="truncate">{it.label}</span>
                </NavLink>
              </div>
            );
          })}
          {isCustom && (
            <button
              type="button"
              onClick={reset}
              className="mt-3 mx-2 inline-flex items-center gap-1.5 text-[11.5px] text-ivory/45 hover:text-brass transition-colors"
              data-testid="admin-nav-reset-order"
            >
              <RotateCcw size={11} strokeWidth={1.7} />
              <span>{lang === "ar" ? "إعادة الترتيب الافتراضي" : "Reset default order"}</span>
            </button>
          )}
        </nav>
        <div className="p-4 border-t border-ivory/10 space-y-2">
          <div className="text-[11px] uppercase tracking-[0.22em] text-ivory/40">
            {user.name}
          </div>
          <div className="text-[13px] text-ivory/75 truncate">{user.email}</div>
          <div className="text-[11px] text-brass">{user.role}</div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={toggle}
              className="h-8 px-2 text-[12px] border border-ivory/20 text-ivory/70 hover:text-ivory hover:border-ivory/40"
              data-testid="admin-lang-switch"
            >
              {t("lang.switch")}
            </button>
            <button
              type="button"
              onClick={async () => { await logout(); navigate("/"); }}
              className="flex-1 h-8 inline-flex items-center justify-center gap-2 text-[12.5px] border border-ivory/20 text-ivory/80 hover:text-ivory hover:border-ivory/40"
              data-testid="admin-logout"
            >
              <LogOut size={14} />
              <span>{t("nav.logout")}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0" data-testid="admin-main">
        <Outlet context={{ overview, user }} />
      </main>
    </div>
  );
}

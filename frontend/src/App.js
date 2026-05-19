import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "@/App.css";
import "@/styles/theme-b.css";
import "@/admin/tiptap.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/auth/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTheme } from "@/hooks/useTheme";

import HomePage from "@/pages/HomePage";

import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AccountPage from "@/pages/AccountPage";
import PublicationsPage from "@/pages/PublicationsPage";
import PublicationDetailPage from "@/pages/PublicationDetailPage";
import ContactPage from "@/pages/ContactPage";
import SiteSettingsAdmin from "@/admin/pages/SiteSettingsAdmin";
import BrandingAdmin from "@/admin/pages/BrandingAdmin";
import HomeAdmin from "@/admin/pages/HomeAdmin";
import AboutAdmin from "@/admin/pages/AboutAdmin";
import ContactAdmin from "@/admin/pages/ContactAdmin";
import PublicationsPageAdmin from "@/admin/pages/PublicationsPageAdmin";
import ActivitiesPageAdmin from "@/admin/pages/ActivitiesPageAdmin";
import FellowsPageAdmin from "@/admin/pages/FellowsPageAdmin";
import NewsAdmin from "@/admin/pages/NewsAdmin";
import AboutPage from "@/pages/AboutPage";
import ActivitiesPage from "@/pages/ActivitiesPage";
import FellowsPage from "@/pages/FellowsPage";
import NewsDetailPage from "@/pages/NewsDetailPage";
import ResponsesAdmin from "@/admin/pages/ResponsesAdmin";
import AuditLogAdmin from "@/admin/pages/AuditLogAdmin";
import { PublicationsListAdmin, PublicationEditAdmin } from "@/admin/pages/PublicationsAdmin";
import { AuthorsAdmin, CategoriesAdmin, UsersAdmin, MessagesAdmin } from "@/admin/pages/SimpleAdmins";
import AdminLayout from "@/admin/AdminLayout";
import AdminOverview from "@/admin/pages/AdminOverview";
import AdminComingSoon from "@/admin/pages/AdminComingSoon";
import NewsletterAdmin from "@/admin/pages/NewsletterAdmin";
import DynamicPage from "@/pages/DynamicPage";
import PagesAdmin from "@/admin/pages/PagesAdmin";
import CustomPageAdmin from "@/admin/pages/CustomPageAdmin";
import AllSectionsAdmin from "@/admin/pages/AllSectionsAdmin";

/** Small ambient component that pushes dynamic brand tokens onto :root
 *  once site-settings are loaded (primary_color, accent_color, etc.). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function BrandThemeSync() {
  const { data } = useSiteSettings();
  useTheme();
  useEffect(() => {
    if (!data) return;
    const r = document.documentElement.style;
    // Keep the palette in sync if admin edits it later.
    if (data.primary_color) r.setProperty("--lz-primary-hex", data.primary_color);
    if (data.accent_color) r.setProperty("--lz-accent-hex", data.accent_color);
    if (data.background_color) r.setProperty("--lz-bg-hex", data.background_color);
    if (data.site_name_ar || data.site_name_en) {
      const ar = data.site_name_ar || "";
      const en = data.site_name_en || "";
      document.title = `${ar} — ${en}`.trim();
    }
  }, [data]);
  return null;
}

function App() {
  return (
    <LanguageProvider defaultLang="ar">
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <BrandThemeSync />
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/publications" element={<PublicationsPage />} />
            <Route path="/publications/:slug" element={<PublicationDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/activities/:slug" element={<NewsDetailPage />} />
            <Route path="/fellows" element={<FellowsPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Dynamic pages */}
            <Route path="/pages/:slug" element={<DynamicPage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/account" element={<AccountPage />} />

            {/* Admin shell */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="publications" element={<PublicationsListAdmin />} />
              <Route path="publications/:id" element={<PublicationEditAdmin />} />
              <Route path="authors" element={<AuthorsAdmin />} />
              <Route path="responses" element={<ResponsesAdmin />} />
              <Route path="audit" element={<AuditLogAdmin />} />
              <Route path="users" element={<UsersAdmin />} />
              <Route path="messages" element={<MessagesAdmin />} />
              <Route path="newsletter" element={<NewsletterAdmin />} />
              <Route path="home" element={<HomeAdmin />} />
              <Route path="about" element={<AboutAdmin />} />
              <Route path="contact" element={<ContactAdmin />} />
              <Route path="activities-page" element={<ActivitiesPageAdmin />} />
              <Route path="fellows-page" element={<FellowsPageAdmin />} />
              <Route path="news" element={<NewsAdmin />} />
              <Route path="publications-page" element={<PublicationsPageAdmin />} />
              <Route path="branding" element={<BrandingAdmin />} />
              <Route path="settings" element={<SiteSettingsAdmin />} />
              <Route path="categories" element={<CategoriesAdmin />} />
              <Route path="pages" element={<PagesAdmin />} />
              <Route path="pages/:id" element={<CustomPageAdmin />} />
              <Route path="all-sections" element={<AllSectionsAdmin />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

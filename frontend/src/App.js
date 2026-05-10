import { useEffect } from "react";
import "@/App.css";
import "@/styles/theme-b.css";
import "@/admin/tiptap.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/auth/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTheme } from "@/hooks/useTheme";

import HomePage from "@/pages/HomePage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AccountPage from "@/pages/AccountPage";
import PublicationsPage from "@/pages/PublicationsPage";
import PublicationDetailPage from "@/pages/PublicationDetailPage";
import ContactPage from "@/pages/ContactPage";
import SiteSettingsAdmin from "@/admin/pages/SiteSettingsAdmin";
import BrandingAdmin from "@/admin/pages/BrandingAdmin";
import HomeAdmin from "@/admin/pages/HomeAdmin";
import ImagesAdmin from "@/admin/pages/ImagesAdmin";
import HeroMediaAdmin from "@/admin/pages/HeroMediaAdmin";
import AboutPage from "@/pages/AboutPage";
import ResponsesAdmin from "@/admin/pages/ResponsesAdmin";
import AuditLogAdmin from "@/admin/pages/AuditLogAdmin";
import { PublicationsListAdmin, PublicationEditAdmin } from "@/admin/pages/PublicationsAdmin";
import { AuthorsAdmin, CategoriesAdmin, UsersAdmin, RolesAdmin, TogglesAdmin, MessagesAdmin } from "@/admin/pages/SimpleAdmins";
import AdminLayout from "@/admin/AdminLayout";
import AdminOverview from "@/admin/pages/AdminOverview";
import AdminComingSoon from "@/admin/pages/AdminComingSoon";

/** Small ambient component that pushes dynamic brand tokens onto :root
 *  once site-settings are loaded (primary_color, accent_color, etc.). */
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
          <BrandThemeSync />
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/publications" element={<PublicationsPage />} />
            <Route path="/publications/:slug" element={<PublicationDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route
              path="/policy"
              element={<PlaceholderPage titleKey="footer.legal" noteKey="admin.comingSoon" />}
            />
            <Route
              path="/privacy"
              element={<PlaceholderPage titleKey="footer.privacy" noteKey="admin.comingSoon" />}
            />
            <Route
              path="/terms"
              element={<PlaceholderPage titleKey="footer.terms" noteKey="admin.comingSoon" />}
            />

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
              <Route path="roles" element={<RolesAdmin />} />
              <Route path="messages" element={<MessagesAdmin />} />
              <Route path="home" element={<HomeAdmin />} />
              <Route path="branding" element={<BrandingAdmin />} />
              <Route path="images" element={<ImagesAdmin />} />
              <Route path="hero-media" element={<HeroMediaAdmin />} />
              <Route path="settings" element={<SiteSettingsAdmin />} />
              <Route path="categories" element={<CategoriesAdmin />} />
              <Route path="toggles" element={<TogglesAdmin />} />
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

import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/auth/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

import HomePage from "@/pages/HomePage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AccountPage from "@/pages/AccountPage";
import AdminLayout from "@/admin/AdminLayout";
import AdminOverview from "@/admin/pages/AdminOverview";
import AdminComingSoon from "@/admin/pages/AdminComingSoon";

/** Small ambient component that pushes dynamic brand tokens onto :root
 *  once site-settings are loaded (primary_color, accent_color, etc.). */
function BrandThemeSync() {
  const { data } = useSiteSettings();
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
            <Route
              path="/publications"
              element={<PlaceholderPage titleKey="nav.publications" noteKey="admin.comingSoon" />}
            />
            <Route
              path="/about"
              element={<PlaceholderPage titleKey="nav.about" noteKey="admin.comingSoon" />}
            />
            <Route
              path="/contact"
              element={<PlaceholderPage titleKey="nav.contact" noteKey="admin.comingSoon" />}
            />
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
              <Route path="publications" element={<AdminComingSoon titleAr="إدارة الإصدارات" titleEn="Publications Management" />} />
              <Route path="authors" element={<AdminComingSoon titleAr="الباحثون" titleEn="Researchers" />} />
              <Route path="responses" element={<AdminComingSoon titleAr="مراجعة الردود البحثية" titleEn="Research Responses" />} />
              <Route path="users" element={<AdminComingSoon titleAr="المستخدمون والأدوار" titleEn="Users & Roles" />} />
              <Route path="messages" element={<AdminComingSoon titleAr="صندوق الرسائل" titleEn="Messages" />} />
              <Route path="home" element={<AdminComingSoon titleAr="محتوى الصفحة الرئيسية" titleEn="Home Content" />} />
              <Route path="branding" element={<AdminComingSoon titleAr="الهوية والتصميم" titleEn="Branding & Design" />} />
              <Route path="settings" element={<AdminComingSoon titleAr="إعدادات الموقع" titleEn="Site Settings" />} />
              <Route path="toggles" element={<AdminComingSoon titleAr="مفاتيح الميزات" titleEn="Feature Toggles" />} />
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

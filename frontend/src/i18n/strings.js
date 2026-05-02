// Lightweight i18n system — static UI strings.
// Content (hero, about, etc.) comes from the backend via /api/public/home-content.

export const STRINGS = {
  ar: {
    nav: {
      home: "الرئيسية",
      publications: "الإصدارات",
      authors: "الباحثون",
      about: "عن المركز",
      contact: "تواصل",
      login: "تسجيل الدخول",
      register: "حساب جديد",
      account: "الحساب",
      admin: "لوحة التحكم",
      logout: "تسجيل الخروج",
    },
    lang: { switch: "EN", label: "العربية" },
    footer: {
      quickLinks: "روابط سريعة",
      contactUs: "تواصل معنا",
      followUs: "حسابات المركز",
      institutional: "مؤسسة بحثية متخصصة في الدراسات القانونية والسياسات العامة.",
      legal: "سياسة النشر",
      privacy: "سياسة الخصوصية",
      terms: "شروط الاستخدام",
    },
    common: {
      readMore: "اقرأ المزيد",
      viewAll: "عرض الكل",
      backToHome: "العودة للرئيسية",
      loading: "جارٍ التحميل…",
      error: "تعذّر تحميل البيانات",
    },
    hero: {
      explore: "استعراض الإصدارات",
      contact: "تواصل مع المركز",
      established: "مقرّه المملكة العربية السعودية",
    },
    admin: {
      title: "لوحة تحكم المركز",
      signIn: "تسجيل دخول المحررين",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      submit: "دخول",
      dashboard: "نظرة عامة",
      comingSoon: "هذه الوحدة قيد البناء في المرحلة القادمة.",
      phase1Note: "هذه المرحلة الأولى — تم تجهيز الهيكل فقط.",
    },
    auth: {
      notAuthenticated: "يرجى تسجيل الدخول للمتابعة.",
      invalidCredentials: "بيانات الدخول غير صحيحة.",
    },
  },
  en: {
    nav: {
      home: "Home",
      publications: "Publications",
      authors: "Researchers",
      about: "About",
      contact: "Contact",
      login: "Log in",
      register: "Register",
      account: "Account",
      admin: "Admin",
      logout: "Log out",
    },
    lang: { switch: "ع", label: "English" },
    footer: {
      quickLinks: "Quick Links",
      contactUs: "Contact",
      followUs: "Follow the Center",
      institutional: "An independent research center for legal studies and public policy.",
      legal: "Publishing Policy",
      privacy: "Privacy",
      terms: "Terms",
    },
    common: {
      readMore: "Read more",
      viewAll: "View all",
      backToHome: "Back to home",
      loading: "Loading…",
      error: "Failed to load data",
    },
    hero: {
      explore: "Explore Publications",
      contact: "Contact the Center",
      established: "Based in the Kingdom of Saudi Arabia",
    },
    admin: {
      title: "LIZAM Admin Console",
      signIn: "Editor sign-in",
      email: "Email address",
      password: "Password",
      submit: "Sign in",
      dashboard: "Overview",
      comingSoon: "This module will be built in the next phase.",
      phase1Note: "Phase 1 — scaffolding only.",
    },
    auth: {
      notAuthenticated: "Please sign in to continue.",
      invalidCredentials: "Invalid email or password.",
    },
  },
};

export function getString(lang, path, fallback = "") {
  const parts = path.split(".");
  let cursor = STRINGS[lang] || STRINGS.ar;
  for (const p of parts) {
    if (cursor && typeof cursor === "object" && p in cursor) {
      cursor = cursor[p];
    } else {
      return fallback || path;
    }
  }
  return typeof cursor === "string" ? cursor : fallback || path;
}

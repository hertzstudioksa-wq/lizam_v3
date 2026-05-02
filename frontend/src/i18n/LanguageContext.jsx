import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { STRINGS, getString } from "@/i18n/strings";

const LanguageContext = createContext(null);
const STORAGE_KEY = "lizam.lang";

export function LanguageProvider({ children, defaultLang = "ar" }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window === "undefined") return defaultLang;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "en" || saved === "ar" ? saved : defaultLang;
  });

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.setAttribute("data-lang", lang);
  }, [lang, dir]);

  const setLang = useCallback((next) => {
    const v = next === "en" || next === "ar" ? next : "ar";
    setLangState(v);
    try {
      window.localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* noop */
    }
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "ar" ? "en" : "ar");
  }, [lang, setLang]);

  const t = useCallback(
    (path, fallback) => getString(lang, path, fallback),
    [lang]
  );

  // Pick bilingual field from a content object: e.g. pick(obj, "title") -> title_ar or title_en
  const pick = useCallback(
    (obj, key, fallback = "") => {
      if (!obj) return fallback;
      const full = obj[`${key}_${lang}`];
      if (typeof full === "string" && full.length) return full;
      const other = obj[`${key}_${lang === "ar" ? "en" : "ar"}`];
      return other || fallback;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, dir, setLang, toggle, t, pick, STRINGS }),
    [lang, dir, setLang, toggle, t, pick]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}

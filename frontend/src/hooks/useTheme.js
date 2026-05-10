import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * useTheme — single source of truth for the public site theme.
 * Reads `active_theme` from public site_settings and:
 *   1. Applies `data-theme="a" | "b"` to <html> so CSS tokens swap globally.
 *   2. Applies dynamic font-family CSS variables for AR / EN font management.
 * Defaults to "B" when the field is missing on legacy admin-edited records.
 */
export function useTheme() {
  const { data } = useSiteSettings();
  const theme = (data?.active_theme || "B").toUpperCase() === "A" ? "A" : "B";
  const fs = data?.font_scale || {};

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme.toLowerCase());

    // Font management — admin-selected fonts override defaults via CSS vars.
    if (data?.font_ar) {
      root.style.setProperty(
        "--lz-font-ar",
        `"${data.font_ar}", "Thmanyah Sans", "IBM Plex Sans Arabic", system-ui, sans-serif`,
      );
    }
    if (data?.font_en) {
      root.style.setProperty(
        "--lz-font-en",
        `"${data.font_en}", "Thmanyah Sans", "Inter", system-ui, sans-serif`,
      );
    }

    // Public-site typography scale (admin-controlled, range 0.85–1.50 each).
    const clamp = (n, fallback) => {
      const v = typeof n === "number" ? n : parseFloat(n);
      if (!Number.isFinite(v)) return fallback;
      return Math.max(0.85, Math.min(1.5, v));
    };
    root.style.setProperty("--tb-fs-hero", String(clamp(fs.hero, 1)));
    root.style.setProperty("--tb-fs-heading", String(clamp(fs.heading, 1)));
    root.style.setProperty("--tb-fs-body", String(clamp(fs.body, 1)));
    root.style.setProperty("--tb-fs-eyebrow", String(clamp(fs.eyebrow, 1)));
  }, [theme, data?.font_ar, data?.font_en, fs.hero, fs.heading, fs.body, fs.eyebrow]);

  return { theme, settings: data };
}

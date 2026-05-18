import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * useTheme — single source of truth for the public site theme.
 * Reads font and scale settings from site_settings and applies:
 *   1. `data-theme="b"` on <html> for CSS token consistency.
 *   2. Dynamic font-family CSS variables for AR / EN font management.
 */
export function useTheme() {
  const { data } = useSiteSettings();
  const theme = "B";
  const fs = data?.font_scale || {};

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", "b");

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

    const clamp = (n, fallback) => {
      const v = typeof n === "number" ? n : parseFloat(n);
      if (!Number.isFinite(v)) return fallback;
      return Math.max(0.85, Math.min(1.5, v));
    };
    root.style.setProperty("--tb-fs-hero", String(clamp(fs.hero, 1)));
    root.style.setProperty("--tb-fs-heading", String(clamp(fs.heading, 1)));
    root.style.setProperty("--tb-fs-body", String(clamp(fs.body, 1)));
    root.style.setProperty("--tb-fs-eyebrow", String(clamp(fs.eyebrow, 1)));
  }, [data?.font_ar, data?.font_en, fs.hero, fs.heading, fs.body, fs.eyebrow]);

  return { theme, settings: data };
}

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
  }, [theme, data?.font_ar, data?.font_en]);

  return { theme, settings: data };
}

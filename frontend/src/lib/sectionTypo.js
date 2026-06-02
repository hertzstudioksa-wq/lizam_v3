/**
 * Shared helper for resolving per-field typography overrides written from
 * /admin/home → SectionCard → FieldTypoControls.
 *
 * Reads `home.section_styles[sectionKey].text_styles[fieldKey]` (when present)
 * and returns a small object with normalized fields:
 *   - sizeMul: number (1 if unset)
 *   - fontWeight: number | undefined
 *   - color: string | undefined
 *
 * Components apply these as inline styles. When no override is set, they fall
 * back to the existing component defaults — so the public design stays
 * identical when admins haven't tuned anything.
 */
export function getTextStyles(home, sectionKey, fieldKey) {
  const o = home?.section_styles?.[sectionKey]?.text_styles?.[fieldKey] || {};
  const out = { sizeMul: 1 };
  if (typeof o.size === "number" && o.size > 0) out.sizeMul = o.size;
  if (o.weight) out.fontWeight = Number(o.weight);
  if (o.color) out.color = o.color;
  return out;
}

/**
 * Returns the admin-chosen text-align ("right"|"center"|"left") for a given
 * field, or "" when no override is set. Stored at
 * `home.section_styles[section].text_aligns[fieldKey]`.
 *
 * Use inline:
 *   const align = getTextAlign(home, "about", "main");
 *   style={{ textAlign: align || undefined, ... }}
 */
export function getTextAlign(home, sectionKey, fieldKey) {
  const v = home?.section_styles?.[sectionKey]?.text_aligns?.[fieldKey];
  return v === "right" || v === "center" || v === "left" || v === "justify" ? v : "";
}

/**
 * Returns the diagonal gradient overlay style for a section when the admin
 * has set a `gradient_accent` color. Returns `{}` when unset so callers can
 * spread it safely into `style` without affecting anything else.
 *
 * The gradient is a soft accent in the bottom-left corner, transparent for
 * the upper-right 60% so it never obscures the section's primary background.
 * The accent color is suffixed with "40" (alpha 25%) for subtlety.
 */
export function getGradientOverlay(home, sectionKey) {
  const accent = home?.section_styles?.[sectionKey]?.gradient_accent;
  if (!accent) return {};
  // Normalize: support 3- and 6-digit hex with or without leading "#"
  const hex = accent.startsWith("#") ? accent : `#${accent}`;
  return {
    backgroundImage: `linear-gradient(to bottom left, transparent 60%, ${hex}40 100%)`,
  };
}

/**
 * Convenience: build inline style props for an element, given a base size
 * (CSS value as string), an optional base color, and the resolved text-style.
 *
 * Returns an object suitable for spreading into a React element's `style`.
 *   buildStyle("clamp(2rem, 4vw, 3rem)", "var(--tb-navy-900)", ts)
 */
export function buildStyle(baseSize, baseColor, ts, extra = {}) {
  return {
    fontSize: ts.sizeMul && ts.sizeMul !== 1 ? `calc(${baseSize} * ${ts.sizeMul})` : baseSize,
    color: ts.color || baseColor,
    fontWeight: ts.fontWeight,
    ...extra,
  };
}

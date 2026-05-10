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

import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LanguageContext";

/**
 * LIZAM Logo
 *
 * Variants:
 *   - "dark"  → logo for use on LIGHT backgrounds (default)
 *   - "light" → inverted logo for use on DARK backgrounds (footer/hero overlay)
 *   - "mark"  → just the stacked-books mark (square)
 *
 * The logo image already contains both the English wordmark and the Arabic name.
 * We never distort, recolor, or crop it — we only constrain its height
 * and preserve the aspect ratio (W/H ≈ 1216/484 ≈ 2.51).
 */
export default function Logo({
  variant = "dark",
  height = 56,
  className = "",
  linked = true,
  showArabicName = false,
  "data-testid": testId = "lizam-logo",
}) {
  const { t } = useLang();
  const src =
    variant === "light"
      ? "/brand/lizam-logo-light.png"
      : variant === "mark"
      ? "/brand/lizam-mark.png"
      : "/brand/lizam-logo.png";

  const width = variant === "mark" ? height : Math.round(height * 2.51);

  const imgAlt =
    "LIZAM Center for Legal Research — مركز لزام للدراسات القانونية";

  const img = (
    <img
      src={src}
      alt={imgAlt}
      width={width}
      height={height}
      className={`lz-logo select-none ${className}`}
      draggable={false}
      style={{ height, width: "auto" }}
      data-testid={testId}
    />
  );

  if (!linked) return img;

  return (
    <Link
      to="/"
      aria-label={imgAlt}
      className="inline-flex items-center"
      data-testid={`${testId}-link`}
    >
      {img}
    </Link>
  );
}

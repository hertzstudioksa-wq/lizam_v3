import { useInView } from "@/hooks/useInView";

/**
 * <Reveal /> — wraps children in a div that animates on first viewport entry.
 *
 * Plays once (default). Variants drive the *starting* transform; on
 * intersection the element animates to the "in" state defined in theme-b.css
 * (`.tb-reveal[data-state="in"]`).
 *
 * Usage:
 *   <Reveal variant="up" delay={1}>...</Reveal>     // translateY(40 → 0)
 *   <Reveal variant="left">...</Reveal>             // from-left (-60 → 0)
 *   <Reveal variant="right">...</Reveal>            // from-right (+60 → 0)
 *   <Reveal variant="left-soft">...</Reveal>        // softer 50px variant
 *   <Reveal variant="right-soft">...</Reveal>
 *   <Reveal variant="zoom">...</Reveal>             // scale(0.95 → 1)
 *   <Reveal variant="scaleX">...</Reveal>           // scaleX(0 → 1) center-out
 *
 * `delay` is the stagger index (0..5) → 100ms steps.
 */
const VARIANT_CLASS = {
  up: "tb-reveal tb-reveal-up",
  left: "tb-reveal tb-reveal-left",
  right: "tb-reveal tb-reveal-right",
  "left-soft": "tb-reveal tb-reveal-left-soft",
  "right-soft": "tb-reveal tb-reveal-right-soft",
  zoom: "tb-reveal tb-reveal-zoom",
  scaleX: "tb-reveal tb-reveal-scaleX",
};

export default function Reveal({
  variant = "up",
  delay = 0,
  className = "",
  style,
  as: Tag = "div",
  threshold = 0.18,
  rootMargin = "0px 0px -10% 0px",
  children,
  ...rest
}) {
  const [ref, inView] = useInView({ threshold, rootMargin });
  const base = VARIANT_CLASS[variant] || VARIANT_CLASS.up;
  const stagger = delay > 0 ? `tb-stagger-${Math.min(5, delay)}` : "";
  return (
    <Tag
      ref={ref}
      className={`${base} ${stagger} ${className}`.trim()}
      data-state={inView ? "in" : "out"}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}

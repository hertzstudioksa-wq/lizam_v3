import { useHeroMedia } from "@/hooks/useHeroMedia";

/**
 * HeroMediaLayer
 * --------------
 * Full-width cinematic background media (image or video) for any hero/page band.
 * Lives at the *top* of its parent section and extends BEHIND the fixed header
 * (the parent section reserves enough top padding so headlines are not occluded).
 *
 * Smart-cropping behaviour:
 *  - <img>: object-fit: cover + object-position from focal_x/focal_y so the
 *    important part of the photo stays in frame on every viewport.
 *  - <video>: same object-fit/position, plus poster fallback.
 *
 * The dark overlay is configurable per-page (overlay_opacity 0–0.9). A subtle
 * vertical gradient is layered on top so headlines remain readable even on
 * busy photos.
 *
 * Usage:
 *   <section className="relative">
 *     <HeroMediaLayer pageKey="home" />
 *     <div className="relative z-10"> ... heading ... </div>
 *   </section>
 *
 * Props:
 *  - pageKey: "home" | "publications" | "about" | "contact" | "_default"
 *  - extendBehindHeader: when true (default), the layer overflows ~80px above
 *    the parent so it visually slides under the fixed header.
 */
export default function HeroMediaLayer({
  pageKey,
  extendBehindHeader = true,
  className = "",
  testid = "hero-media-layer",
}) {
  const media = useHeroMedia(pageKey);
  if (!media || !media.url) return null;

  const fx = Math.max(0, Math.min(100, Number(media.focal_x ?? 50)));
  const fy = Math.max(0, Math.min(100, Number(media.focal_y ?? 50)));
  const overlay = Math.max(0, Math.min(0.9, Number(media.overlay_opacity ?? 0.5)));

  const top = extendBehindHeader ? -82 : 0; // matches Header height
  const bottom = 0;

  return (
    <div
      data-testid={testid}
      data-page-key={pageKey}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 ${className}`}
      style={{ top, bottom, zIndex: 0, overflow: "hidden" }}
    >
      {media.media_type === "video" ? (
        <video
          className="absolute inset-0 w-full h-full"
          src={media.url}
          poster={media.poster_url || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          style={{ objectFit: "cover", objectPosition: `${fx}% ${fy}%` }}
        />
      ) : (
        <img
          src={media.url}
          alt=""
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full tb-ken-burns"
          style={{ objectFit: "cover", objectPosition: `${fx}% ${fy}%` }}
        />
      )}
      {/* Dark overlay (admin-controlled opacity) */}
      <div
        className="absolute inset-0"
        style={{ background: `rgba(10, 17, 28, ${overlay})` }}
      />
      {/* Subtle vertical readability gradient — keeps text crisp on top/bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,17,28,0.18) 0%, rgba(10,17,28,0.0) 32%, rgba(10,17,28,0.0) 68%, rgba(10,17,28,0.22) 100%)",
        }}
      />
    </div>
  );
}

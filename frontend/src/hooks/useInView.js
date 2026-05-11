import { useEffect, useRef, useState } from "react";

/**
 * Tiny IntersectionObserver hook — returns [ref, inView].
 * `once: true` keeps inView=true after the first intersection so animations
 * don't replay on re-enter. Threshold and rootMargin are tweakable.
 */
export function useInView({ threshold = 0.2, rootMargin = "0px 0px -10% 0px", once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}

/**
 * Returns a scroll progress [0..1] for the given element relative to the
 * viewport. 0 when the element's top edge is at the bottom of the viewport,
 * 1 when its bottom edge has crossed the top. Used for timeline fill.
 *
 * Uses a callback ref so the scroll listener attaches the moment the node
 * mounts (handles components that early-return null while data is loading).
 */
export function useScrollProgress() {
  const nodeRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const node = nodeRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const start = vh * 0.8;
      const end = -rect.height * 0.2;
      const range = start - end;
      const cur = rect.top;
      const p = 1 - (cur - end) / range;
      setProgress(Math.max(0, Math.min(1, p)));
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Poll a few times shortly after mount to catch the first paint and any
    // delayed DOM insertion (e.g. when the parent component renders the
    // section after async data arrives).
    const poll = setInterval(update, 200);
    setTimeout(() => clearInterval(poll), 2000);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearInterval(poll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Callback ref — fires when the DOM node mounts/unmounts. Triggers an
  // initial update so the first scaleY isn't stuck at 0 if the page is
  // already scrolled past the section start.
  const setRef = (node) => {
    nodeRef.current = node;
    if (node && typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const start = vh * 0.8;
        const end = -rect.height * 0.2;
        const range = start - end;
        const cur = rect.top;
        const p = 1 - (cur - end) / range;
        setProgress(Math.max(0, Math.min(1, p)));
      });
    }
  };

  return [setRef, progress];
}

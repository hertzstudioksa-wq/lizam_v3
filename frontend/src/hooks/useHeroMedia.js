import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Single shared cache for hero media. Components subscribe via useHeroMedia
 * and receive instant updates when an admin saves changes (`invalidateHeroCache`).
 */
const state = { data: null, loading: false, listeners: new Set() };

function notify() {
  for (const l of state.listeners) l(state.data);
}

async function load() {
  if (state.loading) return;
  state.loading = true;
  try {
    const { data } = await api.get("/public/hero-media");
    state.data = data;
    notify();
  } catch {
    /* keep last value */
  } finally {
    state.loading = false;
  }
}

export function invalidateHeroCache() {
  state.data = null;
  load();
}

/**
 * useHeroMedia(pageKey)
 *  → returns the resolved hero media for the given page (or `_default`),
 *    falling back gracefully when the per-page record is disabled or missing
 *    a URL. Returns `null` until first fetch completes.
 */
export function useHeroMedia(pageKey) {
  const [data, setData] = useState(state.data);

  useEffect(() => {
    state.listeners.add(setData);
    if (!state.data) load();
    else setData(state.data);
    return () => state.listeners.delete(setData);
  }, []);

  if (!data) return null;
  const byPage = data.by_page || {};
  const pageRec = byPage[pageKey];
  const fallback = byPage._default;

  const usable = (rec) => rec && rec.enabled !== false && rec.url;
  if (usable(pageRec)) return pageRec;
  if (usable(fallback)) return fallback;
  return null;
}

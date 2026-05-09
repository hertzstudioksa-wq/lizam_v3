import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Shared singleton fetchers — very light, no dependency on react-query for Phase 1.
 * Cached on module level to avoid refetching on route changes.
 *
 * Cache invalidation rule: when admin PATCHes a setting/home/branding, call
 * invalidateSiteCache(...). This ALWAYS re-fetches and pushes the fresh data
 * to every currently-mounted listener — so long-lived components like
 * BrandThemeSync update without a hard reload.
 */
const cache = { site: null, home: null };
const listeners = { site: new Set(), home: new Set() };
const fetchers = {
  site: async () => (await api.get("/public/site-settings")).data,
  home: async () => (await api.get("/public/home-content")).data,
};
let inflight = { site: null, home: null };

function notify(key, data) {
  listeners[key].forEach((l) => l(data));
}

async function loadOnce(key) {
  if (cache[key]) return cache[key];
  if (inflight[key]) return inflight[key];
  inflight[key] = fetchers[key]()
    .then((d) => { cache[key] = d; notify(key, d); return d; })
    .finally(() => { inflight[key] = null; });
  return inflight[key];
}

/**
 * Invalidate cached data and immediately re-fetch + push the fresh value
 * to every active subscriber. Use this after a successful admin PATCH.
 */
export function invalidateSiteCache(key) {
  const keys = key ? [key] : ["site", "home"];
  for (const k of keys) {
    cache[k] = null;
    fetchers[k]()
      .then((d) => { cache[k] = d; notify(k, d); })
      .catch(() => {});
  }
}

function useShared(key) {
  const [data, setData] = useState(cache[key]);
  const [loading, setLoading] = useState(!cache[key]);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    const update = (d) => { if (active) { setData(d); setLoading(false); } };
    listeners[key].add(update);
    if (cache[key]) {
      setLoading(false);
    } else {
      loadOnce(key)
        .then((d) => { if (active) { setData(d); setLoading(false); } })
        .catch((e) => { if (active) { setError(e); setLoading(false); } });
    }
    return () => { active = false; listeners[key].delete(update); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { data, loading, error };
}

export function useSiteSettings() { return useShared("site"); }
export function useHomeContent() { return useShared("home"); }

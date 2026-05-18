import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Shared singleton fetchers — very light, no dependency on react-query for Phase 1.
 * Cached on module level to avoid refetching on route changes.
 *
 * Cache invalidation rule: when admin PATCHes a setting/home/about/branding,
 * call invalidateSiteCache(...). This ALWAYS re-fetches and pushes the fresh
 * data to every currently-mounted listener — so long-lived components like
 * BrandThemeSync update without a hard reload.
 */
const cache = { site: null, home: null, about: null, contact: null, publications: null, activities: null, fellows: null, customPages: null };
const listeners = { site: new Set(), home: new Set(), about: new Set(), contact: new Set(), publications: new Set(), activities: new Set(), fellows: new Set(), customPages: new Set() };
const fetchers = {
  site: async () => (await api.get("/public/site-settings")).data,
  home: async () => (await api.get("/public/home-content")).data,
  about: async () => (await api.get("/public/about-content")).data,
  contact: async () => (await api.get("/public/contact-content")).data,
  publications: async () => (await api.get("/public/publications-page")).data,
  activities: async () => (await api.get("/public/activities-page")).data,
  fellows: async () => (await api.get("/public/fellows-page")).data,
  customPages: async () => (await api.get("/public/custom-pages")).data,
};
let inflight = { site: null, home: null, about: null, contact: null, publications: null, activities: null, fellows: null, customPages: null };

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
  const keys = key ? [key] : ["site", "home", "about", "contact", "publications", "activities", "fellows", "customPages"];
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
export function useAboutContent() { return useShared("about"); }
export function useContactContent() { return useShared("contact"); }
export function usePublicationsPageContent() { return useShared("publications"); }
export function useActivitiesPageContent() { return useShared("activities"); }
export function useFellowsPageContent() { return useShared("fellows"); }
export function useCustomPages() {
  const { data } = useShared("customPages");
  return data?.items || [];
}

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Shared singleton fetchers — very light, no dependency on react-query for Phase 1.
 * Cached on module level to avoid refetching on route changes.
 */
const cache = { site: null, home: null };
const listeners = { site: new Set(), home: new Set() };

async function loadOnce(key, fetcher) {
  if (cache[key]) return cache[key];
  const data = await fetcher();
  cache[key] = data;
  listeners[key].forEach((l) => l(data));
  return data;
}

export function useSiteSettings() {
  const [data, setData] = useState(cache.site);
  const [loading, setLoading] = useState(!cache.site);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const update = (d) => {
      if (active) setData(d);
    };
    listeners.site.add(update);
    if (!cache.site) {
      loadOnce("site", async () => {
        const { data } = await api.get("/public/site-settings");
        return data;
      })
        .then((d) => {
          if (active) {
            setData(d);
            setLoading(false);
          }
        })
        .catch((e) => {
          if (active) {
            setError(e);
            setLoading(false);
          }
        });
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
      listeners.site.delete(update);
    };
  }, []);

  return { data, loading, error };
}

export function useHomeContent() {
  const [data, setData] = useState(cache.home);
  const [loading, setLoading] = useState(!cache.home);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const update = (d) => {
      if (active) setData(d);
    };
    listeners.home.add(update);
    if (!cache.home) {
      loadOnce("home", async () => {
        const { data } = await api.get("/public/home-content");
        return data;
      })
        .then((d) => {
          if (active) {
            setData(d);
            setLoading(false);
          }
        })
        .catch((e) => {
          if (active) {
            setError(e);
            setLoading(false);
          }
        });
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
      listeners.home.delete(update);
    };
  }, []);

  return { data, loading, error };
}

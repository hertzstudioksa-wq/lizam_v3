import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const cache = { data: null };
const listeners = new Set();
let inflight = null;

function notify(d) { listeners.forEach((l) => l(d)); }

async function loadOnce() {
  if (cache.data) return cache.data;
  if (inflight) return inflight;
  inflight = api.get("/public/image-assets")
    .then(({ data }) => { cache.data = data; notify(data); return data; })
    .finally(() => { inflight = null; });
  return inflight;
}

/** Returns { bySlot, items, loading } where bySlot[slot_key] = { url, alt_ar, alt_en, active }. */
export function useImageAssets() {
  const [data, setData] = useState(cache.data);
  const [loading, setLoading] = useState(!cache.data);
  useEffect(() => {
    let active = true;
    const update = (d) => { if (active) { setData(d); setLoading(false); } };
    listeners.add(update);
    if (cache.data) { setLoading(false); }
    else {
      loadOnce()
        .then((d) => { if (active) { setData(d); setLoading(false); } })
        .catch(() => active && setLoading(false));
    }
    return () => { active = false; listeners.delete(update); };
  }, []);
  return { bySlot: data?.by_slot || {}, items: data?.items || [], loading };
}

/**
 * Reset cache AND re-fetch + push fresh data to every active subscriber.
 * Called from ImagesAdmin after a successful PATCH so the public bg images
 * update without a hard reload.
 */
export function resetImageAssetsCache() {
  cache.data = null;
  api.get("/public/image-assets")
    .then(({ data }) => { cache.data = data; notify(data); })
    .catch(() => {});
}

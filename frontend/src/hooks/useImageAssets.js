import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const cache = { data: null };
const listeners = new Set();

async function loadOnce() {
  if (cache.data) return cache.data;
  const { data } = await api.get("/public/image-assets");
  cache.data = data;
  listeners.forEach((l) => l(data));
  return data;
}

/** Returns { bySlot, items, loading } where bySlot[slot_key] = { url, alt_ar, alt_en, active }. */
export function useImageAssets() {
  const [data, setData] = useState(cache.data);
  const [loading, setLoading] = useState(!cache.data);
  useEffect(() => {
    let active = true;
    const update = (d) => active && setData(d);
    listeners.add(update);
    if (!cache.data) {
      loadOnce().then((d) => { if (active) { setData(d); setLoading(false); } }).catch(() => active && setLoading(false));
    } else { setLoading(false); }
    return () => { active = false; listeners.delete(update); };
  }, []);
  return { bySlot: data?.by_slot || {}, items: data?.items || [], loading };
}

/** Reset cache so newly-saved admin edits propagate on next render (call from admin save). */
export function resetImageAssetsCache() {
  cache.data = null;
  listeners.forEach((l) => l(null));
}

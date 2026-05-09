import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "lz_admin_nav_order_v1";

/**
 * Per-user admin sidebar nav order, persisted in localStorage.
 * Default order is the order in which keys are passed in `defaultKeys`.
 * Returns { orderedKeys, setOrder, reset, isCustom }
 */
export default function useAdminNavOrder(defaultKeys) {
  const [order, setOrderState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultKeys;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return defaultKeys;
      // Keep only known keys, append any new defaultKeys not present (forward-compat)
      const known = parsed.filter((k) => defaultKeys.includes(k));
      const missing = defaultKeys.filter((k) => !known.includes(k));
      return [...known, ...missing];
    } catch {
      return defaultKeys;
    }
  });

  // If the set of defaultKeys changes (e.g., a new admin route added), merge in.
  useEffect(() => {
    setOrderState((prev) => {
      const known = prev.filter((k) => defaultKeys.includes(k));
      const missing = defaultKeys.filter((k) => !known.includes(k));
      const merged = [...known, ...missing];
      return merged.length === prev.length && merged.every((k, i) => k === prev[i])
        ? prev
        : merged;
    });
  }, [defaultKeys]);

  const setOrder = useCallback((next) => {
    setOrderState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const reset = useCallback(() => {
    setOrderState(defaultKeys);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, [defaultKeys]);

  const isCustom = JSON.stringify(order) !== JSON.stringify(defaultKeys);

  return { orderedKeys: order, setOrder, reset, isCustom };
}

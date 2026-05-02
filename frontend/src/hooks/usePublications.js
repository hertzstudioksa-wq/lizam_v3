import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function usePublications({ featured, category, pubType, q, sort, limit = 12, offset = 0 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (featured !== undefined) params.set("featured", featured);
    if (category) params.set("category", category);
    if (pubType) params.set("pub_type", pubType);
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    params.set("limit", limit);
    params.set("offset", offset);

    api
      .get(`/public/publications?${params.toString()}`)
      .then(({ data }) => {
        if (active) {
          setData(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [featured, category, pubType, q, sort, limit, offset]);

  return { data, loading, error };
}

export function usePublication(slug) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    api
      .get(`/public/publications/${slug}`)
      .then(({ data }) => {
        if (active) {
          setData(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [slug]);

  return { data, loading, error };
}

export function useCategories() {
  const [data, setData] = useState([]);
  useEffect(() => {
    api.get("/public/categories").then(({ data }) => setData(data.items || [])).catch(() => {});
  }, []);
  return data;
}

import axios from "axios";

export const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");
if (!BACKEND_URL) {
  // eslint-disable-next-line no-console
  console.error("REACT_APP_BACKEND_URL is not set; API calls will fail.");
}
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Helper to format FastAPI error detail (string | array[{msg}] | object)
export function formatApiError(detail) {
  if (detail == null) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" · ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

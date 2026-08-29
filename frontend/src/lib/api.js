import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API_BASE, withCredentials: true });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("fudora_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export function fileUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http") || pathOrUrl.startsWith("data:")) return pathOrUrl;
  if (pathOrUrl.startsWith("/api/")) return `${BACKEND_URL}${pathOrUrl}`;
  return `${API_BASE}/files/${pathOrUrl}`;
}

export function formatErr(e) {
  const d = e?.response?.data?.detail;
  if (!d) return e?.message || "Something went wrong";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map(x => x?.msg || JSON.stringify(x)).join(" ");
  return String(d);
}

export const inr = (n) => `₹${Number(n || 0).toFixed(0)}`;

export default api;

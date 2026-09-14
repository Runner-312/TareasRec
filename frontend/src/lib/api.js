import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fileUrl = (path) =>
  `${API}/files/${path}?token=${localStorage.getItem("token")}`;

export const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

export const fmtMinutes = (m) => {
  const h = Math.floor((m || 0) / 60);
  const r = Math.round((m || 0) % 60);
  if (h === 0) return `${r} min`;
  return `${h}h ${r}m`;
};

export const fmtDate = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
};

export const fmtDateLong = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
};

export default api;

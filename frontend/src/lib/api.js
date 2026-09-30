import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token de corta duración (15 min) solo para ver imágenes; el token de sesión nunca va en la URL.
let fileToken = "";
export const refreshFileToken = async () => {
  if (!localStorage.getItem("token")) {
    fileToken = "";
    return;
  }
  try {
    const { data } = await api.post("/auth/file-token");
    fileToken = data.token;
  } catch {
    fileToken = "";
  }
};
refreshFileToken();
setInterval(refreshFileToken, 10 * 60 * 1000);

export const fileUrl = (path) => `${API}/files/${path}?token=${fileToken}`;

export const TZ = "America/Caracas";

export const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

export const fmtDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("es-VE", { timeZone: TZ, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
};

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

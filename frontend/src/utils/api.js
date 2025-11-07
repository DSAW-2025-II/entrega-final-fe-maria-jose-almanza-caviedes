import axios from "axios";

const metaEnv = typeof import.meta !== "undefined" ? import.meta.env : undefined;
const apiBaseUrl = metaEnv?.VITE_API_URL || process.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000
});

// Añadir token de localStorage si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

import axios from "axios";

const getBaseURL = () => {
  // If VITE_API_BASE_URL is explicitly set, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // In development, use /api (proxied by Vite)
  if (import.meta.env.DEV) {
    return "/api";
  }

  // In production, construct the API URL from the current origin
  // This works if frontend and backend are on the same domain
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/api`;
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      const token = localStorage.getItem("authToken");
      if (token) {
        localStorage.removeItem("authToken");
        // Recarrega para levar o usuário de volta para a tela de login.
        window.location.reload();
      }
    }
    return Promise.reject(error);
  },
);


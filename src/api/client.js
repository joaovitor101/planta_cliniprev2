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


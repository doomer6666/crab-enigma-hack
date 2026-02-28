import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const httpClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 секунд
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized! Redirecting to login...");
    }
    return Promise.reject(error);
  },
);

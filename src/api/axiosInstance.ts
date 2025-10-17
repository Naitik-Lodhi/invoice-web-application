// src/api/axiosInstance.ts
import axios from "axios";
import { BASE_URL } from "../constants/apiEndpoints";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    // Check both storages for token

    console.log("🚀 Axios Request:");
    console.log("   Method:", config.method?.toUpperCase());
    console.log("   URL:", config.url);
    console.log("   Base URL:", config.baseURL);
    console.log("   Params:", config.params);
    console.log("   Full URL:", `${config.baseURL}${config.url}`);

    if (config.url?.includes("GetTrend12m")) {
      console.log("⚠️ TREND API REQUEST INTERCEPTED:");
      console.log("   asOf param:", config.params?.asOf);
      console.log("   Param type:", typeof config.params?.asOf);
    }
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("✅ Axios Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/login")
    ) {
      // Clear auth data from both storages
      ["token", "user", "company"].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

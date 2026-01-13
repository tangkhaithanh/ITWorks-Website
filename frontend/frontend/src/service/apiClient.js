// src/services/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://itworks.dpdns.org",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default apiClient;

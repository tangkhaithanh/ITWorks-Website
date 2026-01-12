// src/services/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://14.225.217.237:3000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default apiClient;

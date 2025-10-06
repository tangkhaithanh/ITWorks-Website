// src/services/setupInterceptors.js
import apiClient from "./apiClient";
import { resetAuth } from "@/features/auth/authActions";

let isRefreshing = false;
let pending = [];

function subscribeTokenRefresh(cb) { pending.push(cb); }
function onRefreshed() { pending.forEach((cb) => cb()); pending = []; }

export function setupAxiosInterceptors(store) {
  apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error?.config;
      const url = original?.url || "";

      const shouldHandle401 =
        error?.response?.status === 401 &&
        !original?._retry &&
        url &&
        !url.includes("/auth/login") &&
        !url.includes("/auth/refresh") &&
        !url.includes("/auth/logout");

      if (!shouldHandle401) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(async () => {
            try { resolve(apiClient(original)); } catch (e) { reject(e); }
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post("/auth/refresh");
        isRefreshing = false;
        onRefreshed();
        return apiClient(original);
      } catch (err) {
        isRefreshing = false;
        onRefreshed();
        // refresh fail: reset state -> ProtectedRoute đưa về /login
        store.dispatch(resetAuth());
        return Promise.reject(err);
      }
    }
  );
}

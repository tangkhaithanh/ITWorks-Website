// src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import { setupAxiosInterceptors } from "@/service/setupInterceptors";

const store = configureStore({
  reducer: rootReducer,
  devTools: import.meta.env.MODE !== "production",
});

// Gắn interceptor SAU khi đã có store → không còn vòng import
setupAxiosInterceptors(store);

export default store;

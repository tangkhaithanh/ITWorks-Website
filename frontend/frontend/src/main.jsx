import React from "react";
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { Provider } from "react-redux";
import store from "@/app/store";
import App from "./App"; 
import "@/styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />  {/* 👈 App chứa BootstrapAuth + RouterProvider */}
    </Provider>
  </StrictMode>
);

// src/features/auth/authActions.js
import { createAction } from "@reduxjs/toolkit";

// action thuần để reset auth state khi refresh fail
export const resetAuth = createAction("auth/reset");

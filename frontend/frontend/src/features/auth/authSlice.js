// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AuthAPI from "./AuthAPI";
import { resetAuth } from "./authActions";

export const login = createAsyncThunk(
  "auth/login",
  async (dto, { rejectWithValue }) => {
    try {
      await AuthAPI.login(dto.email, dto.password);
      const res = await AuthAPI.me();
      return res.data.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed";
      // 👇 luôn trả về object có {message}
      return rejectWithValue({ message: msg });
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await AuthAPI.logout();
  return null;
});

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, loading: false, error: null, initialized: false },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.initialized = true;
    },
    // 👇 thêm clearError để UI gọi khi user gõ lại
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.initialized = true;    
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        // 👇 đảm bảo luôn có error.message
        state.error = action.payload || { message: action.error?.message || "Login failed" };
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.initialized = true;
        state.error = null;
      })
      .addCase(resetAuth, (state) => {
        state.user = null;
        state.initialized = true;
        state.error = null;
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;

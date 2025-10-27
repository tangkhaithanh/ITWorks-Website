import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import JobAPI from "./JobAPI";

export const searchJobs = createAsyncThunk(
  "jobSearch/searchJobs",
  async (params, { rejectWithValue, getState }) => {
    try {
      const state = getState().jobSearch;
      // Ưu tiên params truyền vào, fallback state (persist filter)
      const finalParams = {
        keyword: params?.keyword ?? state.keyword ?? "",
        city: params?.city ?? state.city ?? "",
        page: params?.page ?? 1,
        ...state.filters, // giữ các filter đã apply
        ...params,        // allow override
      };
      const res = await JobAPI.search(finalParams);
      return res.data.data;
    } catch (err) {
      console.error("❌ searchJobs error:", err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const jobSearchSlice = createSlice({
  name: "jobSearch",
  initialState: {
    keyword: "",
    city: "",
    filters: {},
    results: [],
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {
    setKeyword: (state, action) => {
      state.keyword = action.payload;
    },
    setCity: (state, action) => {
      state.city = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...(action.payload || {}) };
      state.results = [];
      state.total = 0;
    },
    clearFilters: (state) => {
      state.filters = {};
      state.results = [];
      state.total = 0;
    },
    resetSearch: () => ({
      keyword: "",
      city: "",
      filters: {},
      results: [],
      total: 0,
      loading: false,
      error: null,
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchJobs.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        // nếu là tìm mới (page 1) thì reset results để tránh "lẫn" dữ liệu cũ
        if (!action.meta?.arg?.page || action.meta.arg.page === 1) {
          state.results = [];
        }
      })
      .addCase(searchJobs.fulfilled, (state, action) => {
        state.loading = false;
        const { results, total, page } = action.payload || {};
        state.total = total || 0;

        if (page && page > 1) {
          state.results = [...state.results, ...(results || [])];
        } else {
          state.results = results || [];
        }
      })
      .addCase(searchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể tìm kiếm công việc";
      });
  },
});

export const {
  setKeyword,
  setCity,
  setFilters,
  clearFilters,
  resetSearch,
} = jobSearchSlice.actions;

export default jobSearchSlice.reducer;

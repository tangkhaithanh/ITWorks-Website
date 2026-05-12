import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import TalentPoolAPI from "./talentPoolAPI";
import { logout } from "@/features/auth/authSlice";

const unwrapApiData = (payload) => {
  if (payload?.success && Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }
  return payload;
};

const normalizeListPayload = (payload) => {
  const data = unwrapApiData(payload);

  if (Array.isArray(data)) {
    return {
      items: data,
      meta: initialState.meta,
    };
  }

  return {
    items: Array.isArray(data?.data) ? data.data : [],
    meta: data?.meta || initialState.meta,
  };
};

export const saveCandidate = createAsyncThunk(
  "talentPool/saveCandidate",
  async (data, { rejectWithValue }) => {
    try {
      const response = await TalentPoolAPI.save(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTalentPool = createAsyncThunk(
  "talentPool/fetchTalentPool",
  async (params, { rejectWithValue }) => {
    try {
      const { jobId, ...rest } = params || {};
      const response = jobId
        ? await TalentPoolAPI.getByJob(jobId, rest)
        : await TalentPoolAPI.getAll(rest);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchCandidateDetail = createAsyncThunk(
  "talentPool/fetchCandidateDetail",
  async (id, { rejectWithValue }) => {
    try {
      const response = await TalentPoolAPI.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateCandidate = createAsyncThunk(
  "talentPool/updateCandidate",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await TalentPoolAPI.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const removeCandidate = createAsyncThunk(
  "talentPool/removeCandidate",
  async (id, { rejectWithValue }) => {
    try {
      await TalentPoolAPI.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  items: [],
  selectedCandidate: null,
  meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
  loading: false,
  saving: false,
  error: null,
};

const talentPoolSlice = createSlice({
  name: "talentPool",
  initialState,
  reducers: {
    clearSelectedCandidate(state) {
      state.selectedCandidate = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveCandidate.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveCandidate.fulfilled, (state, action) => {
        state.saving = false;
        state.items.unshift(unwrapApiData(action.payload));
      })
      .addCase(saveCandidate.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(fetchTalentPool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTalentPool.fulfilled, (state, action) => {
        const { items, meta } = normalizeListPayload(action.payload);
        state.loading = false;
        state.items = items;
        state.meta = meta;
      })
      .addCase(fetchTalentPool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCandidateDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCandidateDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCandidate = unwrapApiData(action.payload);
      })
      .addCase(fetchCandidateDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCandidate.fulfilled, (state, action) => {
        const updatedCandidate = unwrapApiData(action.payload);
        const index = state.items.findIndex(
          (item) => item.id === updatedCandidate.id
        );
        if (index !== -1) {
          state.items[index] = updatedCandidate;
        }
        state.selectedCandidate = updatedCandidate;
      })
      .addCase(removeCandidate.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => item.id !== action.payload
        );
        state.selectedCandidate = null;
      })
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const { clearSelectedCandidate, clearError } = talentPoolSlice.actions;
export default talentPoolSlice.reducer;

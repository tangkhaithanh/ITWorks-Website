// src/features/candidates/candidateSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import CandidateAPI from "./CandidateAPI";
import ApplicationAPI from "@/features/applications/ApplicationAPI";
import toast from "react-hot-toast";

// ───────────────────────────────────────
// 🔹 1️⃣ Kiểm tra job đã lưu hay chưa
// ───────────────────────────────────────
export const checkSavedJob = createAsyncThunk(
  "candidate/checkSavedJob",
  async (jobId, { rejectWithValue }) => {
    try {
      const res = await CandidateAPI.checkSavedJob(jobId);
      const isSaved = res.data?.data?.isSaved ?? false;
      return { jobId, isSaved };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Không thể kiểm tra job đã lưu"
      );
    }
  }
);

// ───────────────────────────────────────
// 🔹 2️⃣ Lưu hoặc bỏ lưu job
// ───────────────────────────────────────
export const toggleSaveJob = createAsyncThunk(
  "candidate/toggleSaveJob",
  async ({ jobId, isSaved }, { rejectWithValue }) => {
    try {
      if (isSaved) {
        await CandidateAPI.unsaveJob(jobId);
        toast("Đã bỏ lưu công việc", { icon: "🗑️" });
        return { jobId, saved: false };
      } else {
        await CandidateAPI.saveJob(jobId);
        toast.success("Đã lưu công việc thành công 🎉");
        return { jobId, saved: true };
      }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Lỗi khi lưu công việc"
      );
    }
  }
);

// ───────────────────────────────────────
// 🔹 3️⃣ Kiểm tra đã ứng tuyển chưa
// ───────────────────────────────────────
export const checkAppliedJob = createAsyncThunk(
  "candidate/checkAppliedJob",
  async (jobId, { rejectWithValue }) => {
    try {
      const res = await ApplicationAPI.checkApplied(jobId);
      const applied = res.data?.data?.applied ?? false;
      return { jobId, applied };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Không thể kiểm tra trạng thái ứng tuyển"
      );
    }
  }
);

// ───────────────────────────────────────
// 🔹 4️⃣ Gửi đơn ứng tuyển (apply job)
// ───────────────────────────────────────
export const applyJob = createAsyncThunk(
  "candidate/applyJob",
  async ({ jobId, cvId }, { rejectWithValue }) => {
    try {
      await ApplicationAPI.apply(jobId, cvId);
      return { jobId };
    } catch (err) {
      const msg = err.response?.data?.message || "Lỗi khi gửi đơn ứng tuyển";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

// ───────────────────────────────────────
// 🧩 Slice chính của Candidate
// ───────────────────────────────────────
const candidateSlice = createSlice({
  name: "candidate",
  initialState: {
    savedJobs: [],   // mảng các job_id đã lưu
    appliedJobs: [], // mảng các job_id đã ứng tuyển
    loading: false,
    error: null,
  },
  reducers: {
    resetCandidateState: (state) => {
      state.savedJobs = [];
      state.appliedJobs = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 📌 Kiểm tra lưu job
      .addCase(checkSavedJob.fulfilled, (state, action) => {
        const { jobId, isSaved } = action.payload;
        if (isSaved && !state.savedJobs.includes(jobId)) {
          state.savedJobs.push(jobId);
        }
      })

      // 📌 Toggle lưu job
      .addCase(toggleSaveJob.fulfilled, (state, action) => {
        const { jobId, saved } = action.payload;
        if (saved) {
          if (!state.savedJobs.includes(jobId)) state.savedJobs.push(jobId);
        } else {
          state.savedJobs = state.savedJobs.filter((id) => id !== jobId);
        }
      })

      // 📌 Kiểm tra đã apply chưa
      .addCase(checkAppliedJob.fulfilled, (state, action) => {
        const { jobId, applied } = action.payload;
        if (applied && !state.appliedJobs.includes(jobId)) {
          state.appliedJobs.push(jobId);
        }
      })

      // 📌 Ứng tuyển thành công
      .addCase(applyJob.fulfilled, (state, action) => {
        const { jobId } = action.payload;
        if (!state.appliedJobs.includes(jobId)) {
          state.appliedJobs.push(jobId);
        }
      })

      // 📌 Trạng thái loading/error
      .addMatcher(
        (action) => action.type.startsWith("candidate/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("candidate/") && action.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("candidate/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || "Lỗi không xác định";
        }
      );
  },
});

export const { resetCandidateState } = candidateSlice.actions;
export default candidateSlice.reducer;
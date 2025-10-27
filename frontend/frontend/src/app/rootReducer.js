import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";  // 👈 import slice auth
import jobSearchReducer from "@/features/jobs/jobSearchSlice";
import candidateReducer from "@/features/candidates/candidateSlice";
// sau này thêm reducers khác (user, job, company, ...) ở đây
const rootReducer = combineReducers({
  auth: authReducer,
  jobSearch: jobSearchReducer,
  candidate: candidateReducer,
});

export default rootReducer;

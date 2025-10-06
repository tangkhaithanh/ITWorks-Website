import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";  // 👈 import slice auth

// sau này thêm reducers khác (user, job, company, ...) ở đây
const rootReducer = combineReducers({
  auth: authReducer,
  // user: userReducer,
  // job: jobReducer,
});

export default rootReducer;

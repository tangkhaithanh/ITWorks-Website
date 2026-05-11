import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";  // 👈 import slice auth
import jobSearchReducer from "@/features/jobs/jobSearchSlice";
import candidateReducer from "@/features/candidates/candidateSlice";
// sau này thêm reducers khác (user, job, company, ...) ở đây
import notificationsReducer from "@/features/notifications/notificationsSlice";
import messagingReducer from "@/features/messaging/messagingSlice";
import talentPoolReducer from "@/features/talent-pool/talentPoolSlice";
const rootReducer = combineReducers({
  auth: authReducer,
  jobSearch: jobSearchReducer,
  candidate: candidateReducer,
  notifications: notificationsReducer,
  messaging: messagingReducer,
  talentPool: talentPoolReducer,
});

export default rootReducer;

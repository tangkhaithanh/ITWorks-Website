import apiClient from "../../service/apiClient";
const AuthAPI = {
  login: (email, password) => apiClient.post("/auth/login", { email, password }),
  logout: () => apiClient.post("/auth/logout"),
  me: () => apiClient.get("/auth/me"),
  registerCandidate: (data) => apiClient.post("/auth/register-candidate", data),
  registerRecruiter: (data) => apiClient.post("/auth/register-recruiter", data),
  sendResetPasswordEmail: (email) => apiClient.post("/auth/request-send", { email }),
  verifyResetToken: (token) => apiClient.post("/auth/verify-reset-token", { token }),
  resetPassword: (token, newPassword) => apiClient.post("/auth/reset-password", { token, newPassword }),
  refresh: () => apiClient.post("/auth/refresh"),
};

export default AuthAPI;
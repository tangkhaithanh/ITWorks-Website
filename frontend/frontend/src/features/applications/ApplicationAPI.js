// frontend/src/features/applications/ApplicationAPI.js
import apiClient from "../../service/apiClient";

const ApplicationAPI = {
  /**
   * 📨 Gửi đơn ứng tuyển
   */
  apply: (job_id, cv_id, cover_letter = "") =>
    apiClient.post("/applications/apply", {
      job_id: String(job_id),
      cv_id: String(cv_id),
      cover_letter,
    }),

  // Kiểm tra xem ứng viên có ứng tuyển công việc này hay chưa:
  checkApplied: (jobId) => apiClient.get(`/applications/${jobId}/check`),

  // 🧑‍💼 Ứng viên – quản lý đơn ứng tuyển của chính mình
  getMyApplications: (params) =>
    apiClient.get("/applications/my", { params }),

  getMyApplicationDetail: (id) =>
    apiClient.get(`/applications/my/${id}`),

  withdrawMyApplication: (id) =>
    apiClient.patch(`/applications/my/${id}/withdraw`),

  // 🏢 Dành cho recruiter (đã có sẵn)
  getByCompany: (params) => apiClient.get("/applications/company", { params }),
  accept: (id) => apiClient.patch(`/applications/${id}/accept`),
  reject: (id) => apiClient.patch(`/applications/${id}/reject`),
  getDetail: (id) => apiClient.get(`/applications/company/${id}`),
};

export default ApplicationAPI;

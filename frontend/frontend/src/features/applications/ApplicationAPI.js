import apiClient from "../../service/apiClient";

const ApplicationAPI = {
  /**
   * 📨 Gửi đơn ứng tuyển
   * @param {string|number} job_id - ID công việc
   * @param {string|number} cv_id - ID CV được chọn
   */
  apply: (job_id, cv_id) =>
    apiClient.post("/applications/apply", {
      job_id: String(job_id),
      cv_id: String(cv_id),
    }),
    // Kiểm tra xem ứng viên có ứng tuyển công việc này hay chưa:
  checkApplied: (jobId) => apiClient.get(`/applications/${jobId}/check`),

  // (tuỳ chọn thêm nếu sau này cần)
  // getMyApplications: () => apiClient.get("/applications/my"),
  getByCompany: (params) => apiClient.get("/applications/company", { params }),
  accept: (id) => apiClient.patch(`/applications/${id}/accept`),
  reject: (id) => apiClient.patch(`/applications/${id}/reject`),
};

export default ApplicationAPI;
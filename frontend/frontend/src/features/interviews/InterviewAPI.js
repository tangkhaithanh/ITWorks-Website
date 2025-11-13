import apiClient from "@/service/apiClient";

const InterviewAPI = {
  /**
   * Tạo lịch phỏng vấn mới
   * @param {Object} payload
   */
  create: (payload) => apiClient.post("/interviews", payload),

  /**
   * Cập nhật thông tin lịch phỏng vấn
   * @param {string|number} id
   * @param {Object} payload
   */
  update: (id, payload) => apiClient.put(`/interviews/${id}`, payload),

  /**
   * Huỷ lịch phỏng vấn
   * @param {string|number} id
   */
  cancel: (id) => apiClient.post(`/interviews/${id}/cancel`),

  /**
   * Ứng viên xác nhận lịch phỏng vấn
   * @param {string|number} id
   */
  confirm: (id) => apiClient.post(`/interviews/${id}/confirm`),

  /**
   * Lấy danh sách lịch phỏng vấn
   * @param {Object} params
   */
  list: (params = {}) => apiClient.get("/interviews", { params }),
};

export default InterviewAPI;

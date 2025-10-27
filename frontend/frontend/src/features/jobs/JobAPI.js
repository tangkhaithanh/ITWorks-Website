import apiClient from "../../service/apiClient";

const JobAPI = {
  // 🔍 Tìm kiếm công việc (đổi sang POST)
  search: (params) => apiClient.post("/jobs/search", params),

  // 🔎 Gợi ý từ khóa (autocomplete)
  suggest: (q) => apiClient.get("/jobs/suggest", { params: { q } }),

  // 📄 Chi tiết công việc
  getDetail: (id) => apiClient.get(`/jobs/${id}`),

  // 🧩 Dành cho recruiter
  create: (data) => apiClient.post("/jobs", data),
  update: (id, data) => apiClient.patch(`/jobs/${id}`, data),
  hide: (id) => apiClient.patch(`/jobs/${id}/hide`),
  unhide: (id) => apiClient.patch(`/jobs/${id}/unhide`),
  close: (id) => apiClient.patch(`/jobs/${id}/close`),
  
};

export default JobAPI;

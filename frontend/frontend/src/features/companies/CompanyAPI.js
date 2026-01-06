import apiClient from "../../service/apiClient";

const CompanyAPI = {
  // ======================
  // 📌 Recruiter APIs
  // ======================

  // Lấy công ty thuộc tài khoản recruiter
  getMyCompany: () => apiClient.get("/companies/my-company"),

  // Lấy chi tiết công ty theo ID (public)
  getDetail: (id) => apiClient.get(`/companies/${id}`),

  // Lấy công ty để edit (backend có route /:id/edit)
  getForEdit: (id) => apiClient.get(`/companies/${id}/edit`),

  // Tạo công ty (POST) — hỗ trợ upload logo + licenseFile
  create: (formData) =>
    apiClient.post("/companies", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Cập nhật công ty
  update: (id, formData) =>
    apiClient.patch(`/companies/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // ======================
  // ⚙️ Actions (Recruiter / Admin)
  // ======================

  hide: (id) => apiClient.patch(`/companies/${id}/hide`),
  unhide: (id) => apiClient.patch(`/companies/${id}/unhide`),

  // Admin duyệt công ty
  approve: (id) => apiClient.patch(`/companies/${id}/approve`),
  reject: (id) => apiClient.patch(`/companies/${id}/reject`),
  getRecruiterDashboard: (params) =>
    apiClient.get("/dashboard/recruiter", { params }),

  // Lấy toàn bộ công ty dành cho admin:
  getAllForAdmin: (params) => apiClient.get("/companies", { params }),
  search: (params) =>
      apiClient.get("/companies/search", { params }),
};
export default CompanyAPI;

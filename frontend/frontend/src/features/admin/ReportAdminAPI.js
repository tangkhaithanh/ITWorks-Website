import apiClient from "@/service/apiClient";

const ReportAdminAPI = {
  list: (params) => apiClient.get("/reports/admin", { params }),
  getDetail: (id) => apiClient.get(`/reports/admin/${id}`),
  updateStatus: (id, data) =>
    apiClient.patch(`/reports/admin/${id}/status`, data),
  closeReportedJob: (id, data) =>
    apiClient.patch(`/reports/admin/${id}/close-job`, data),
};

export default ReportAdminAPI;

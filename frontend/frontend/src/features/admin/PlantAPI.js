import apiClient from "../../service/apiClient";
const PlanAPI = {
    // Admin: lấy toàn bộ plan (kể cả hidden)
    getAllAdmin: () => apiClient.get("/plans/admin/all"),
    hidePlan: (id) => apiClient.delete(`/plans/${id}`),
    unhidePlan: (id) => apiClient.patch(`/plans/${id}`),
    getAdminDetail: (id) => apiClient.get(`/plans/admin/${id}`),
    create: (data) => apiClient.post("/plans", data),
    update: (id, data) => apiClient.patch(`/plans/${id}`, data),
};
export default PlanAPI;
import apiClient from "../../service/apiClient";

const AdminDashboardAPI = {
    /**
     * GET /dashboard/admin
     * query: { range?: '7d'|'30d'|'3m'|'1y', from?: 'YYYY-MM-DD', to?: 'YYYY-MM-DD' }
     */
    getDashboard: (params) => apiClient.get("/dashboard/admin", { params }),
};

export default AdminDashboardAPI;

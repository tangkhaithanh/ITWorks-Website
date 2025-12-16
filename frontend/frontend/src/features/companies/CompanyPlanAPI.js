import apiClient from "../../service/apiClient";

const CompanyPlanAPI = {
    // Lấy thông tin gói hiện tại của company (summary)
    getCurrentSummary: () => apiClient.get("/company/plans/summary"),

    // (optional, dùng sau này)
    getUpgradeOptions: () => apiClient.get("/company/plans/upgrade-options"),
};

export default CompanyPlanAPI;

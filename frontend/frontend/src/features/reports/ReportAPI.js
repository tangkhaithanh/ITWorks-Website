import apiClient from "@/service/apiClient";

const ReportAPI = {
  create: (data) => apiClient.post("/reports", data),
};

export default ReportAPI;

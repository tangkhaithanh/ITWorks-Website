import apiClient from "../../service/apiClient";

const IndustryAPI = {
  // 🏭 Lấy tất cả ngành nghề
  getAll: () => apiClient.get("/industries"),
};

export default IndustryAPI;

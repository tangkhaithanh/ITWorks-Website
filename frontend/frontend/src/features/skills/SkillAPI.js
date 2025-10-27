import apiClient from "../../service/apiClient";

const SkillAPI = {
  // 🧠 Lấy tất cả kỹ năng
  getAll: () => apiClient.get("/skills"),
};

export default SkillAPI;

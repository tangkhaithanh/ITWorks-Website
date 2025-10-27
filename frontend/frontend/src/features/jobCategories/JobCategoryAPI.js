import apiClient from "../../service/apiClient";

const JobCategoryAPI = {
  // 📦 Lấy tất cả danh mục nghề nghiệp
  getAll: () => apiClient.get("/job-categories"),
};

export default JobCategoryAPI;

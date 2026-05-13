import apiClient from "../../service/apiClient";

const RecommendationAPI = {
  getRecommendations: (topK = 10) =>
    apiClient.get("/recommendations", { params: { top_k: topK } }),
};

export default RecommendationAPI;

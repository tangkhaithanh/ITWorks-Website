import apiClient from "@/service/apiClient";

const MatchingHistoryAPI = {
  getSummaries: () => apiClient.get("/matching/history"),
  getSession: (id) => apiClient.get(`/matching/history/${id}`),
};

export default MatchingHistoryAPI;

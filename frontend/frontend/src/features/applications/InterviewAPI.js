import apiClient from "../../service/apiClient";

const InterviewAPI = {
  create: (data) => apiClient.post("/interviews", data),
  update: (id, data) => apiClient.patch(`/interviews/${id}`, data),
  cancel: (id) => apiClient.patch(`/interviews/${id}/cancel`),
};

export default InterviewAPI;
import apiClient from "../../service/apiClient";

const TalentPoolAPI = {
  save: (data) => apiClient.post("/potential-candidates", data),

  getAll: (params = {}) => apiClient.get("/potential-candidates", { params }),

  getByJob: (jobId, params = {}) =>
    apiClient.get("/potential-candidates", {
      params: { ...params, jobId },
    }),

  getById: (id) => apiClient.get(`/potential-candidates/${id}`),

  update: (id, data) => apiClient.put(`/potential-candidates/${id}`, data),

  remove: (id) => apiClient.delete(`/potential-candidates/${id}`),
};

export default TalentPoolAPI;

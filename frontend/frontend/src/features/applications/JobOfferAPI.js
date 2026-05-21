import apiClient from "../../service/apiClient";

const JobOfferAPI = {
  getByApplicationId: (applicationId) => apiClient.get(`/job-offers/${applicationId}`),
  getMyOffers: () => apiClient.get("/job-offers/my"),
  getMyOfferById: (id) => apiClient.get(`/job-offers/my/${id}`),
  accept: (id) => apiClient.patch(`/job-offers/${id}/accept`),
  reject: (id) => apiClient.patch(`/job-offers/${id}/reject`),
  create: (data) => apiClient.post("/job-offers", data),
};

export default JobOfferAPI;

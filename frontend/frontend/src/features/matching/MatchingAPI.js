import apiClient from "@/service/apiClient";

const resolveOrigin = (rawUrl) => {
  if (!rawUrl) {
    return typeof window !== "undefined" ? window.location.origin : "";
  }

  try {
    return new URL(rawUrl).origin;
  } catch {
    return rawUrl;
  }
};

const apiUrl = "http://localhost:3000";

const MatchingAPI = {
  rankApplicants: (sourceJobId) =>
    apiClient.get(`/matching/${sourceJobId}/rank-applicants`),

  findTalent: (sourceJobId) =>
    apiClient.get(`/matching/${sourceJobId}/find-talent`),
};

export const getBackendOrigin = () => resolveOrigin(apiUrl);

export default MatchingAPI;

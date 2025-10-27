import apiClient from "../../service/apiClient";

const CandidateAPI = {
  saveJob: (jobId) => apiClient.post("/candidates/saved-jobs", { job_id: jobId }),
  unsaveJob: (jobId) => apiClient.delete(`/candidates/saved-jobs/${jobId}`),
  getSavedJobs: () => apiClient.get("/candidates/saved-jobs"),
  checkSavedJob: (jobId) => apiClient.get(`/candidates/saved-jobs/${jobId}/check`),

  viewCv: async (filename) => {
    const res = await apiClient.get(`/cvs/view/${filename}`, {
      responseType: "blob", // nhận về PDF blob
      withCredentials: true, // gửi cookie JWT access_token
    });
    return res;
  },
};
export default CandidateAPI;

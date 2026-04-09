import apiClient from "@/service/apiClient";

const MessagingAPI = {
  list: () => apiClient.get("/conversations"),
  get: (id) => apiClient.get(`/conversations/${id}`),
  messages: (id, params) =>
    apiClient.get(`/conversations/${id}/messages`, { params }),
  send: (id, body) =>
    apiClient.post(`/conversations/${id}/messages`, { body }),
  /** Ứng viên: mở chat theo job */
  open: (job_id) =>
    apiClient.post("/conversations/open", { job_id: String(job_id) }),
  /** Recruiter: bắt đầu chat với account ứng viên */
  start: (job_id, applicant_account_id) =>
    apiClient.post("/conversations/start", {
      job_id: String(job_id),
      applicant_account_id: String(applicant_account_id),
    }),
};

export default MessagingAPI;

import apiClient from "@/service/apiClient";

const MessagingAPI = {
  list: () => apiClient.get("/conversations"),
  get: (id) => apiClient.get(`/conversations/${id}`),
  messages: (id, params) =>
    apiClient.get(`/conversations/${id}/messages`, { params }),
  send: (id, body) =>
    apiClient.post(`/conversations/${id}/messages`, { body }),
  sendWithAttachments: (id, body, files = []) => {
    const formData = new FormData();
    if (body?.trim()) {
      formData.append("body", body.trim());
    }
    files.forEach((file) => {
      formData.append("files", file);
    });
    return apiClient.post(`/conversations/${id}/messages/with-attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
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

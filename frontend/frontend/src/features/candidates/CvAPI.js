import apiClient from "../../service/apiClient";

const CvAPI = {
  // 📄 Danh sách CV online
  getMyOnlineCvs: (page = 1, limit = 10) =>
    apiClient.get(`/cvs/my/online?page=${page}&limit=${limit}`),

  // 📂 Danh sách CV upload file
  getMyFileCvs: (page = 1, limit = 10) =>
    apiClient.get(`/cvs/my/file?page=${page}&limit=${limit}`),

  // 📄 Chi tiết 1 CV
  getDetail: (id) => apiClient.get(`/cvs/${id}`),

  // ➕ Tạo CV online
  createOnline: (data) => apiClient.post("/cvs", data),

  // 📤 Upload file CV (PDF, DOCX)
  uploadFile: (file, title) => {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    return apiClient.post("/cvs/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ✏️ Cập nhật CV
  update: (id, data) => apiClient.put(`/cvs/${id}`, data),

  // 🔁 Thay thế file CV
  replaceFile: (id, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.put(`/cvs/${id}/replace`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 🗑️ Xóa CV
  delete: (id) => apiClient.delete(`/cvs/${id}`),
};

export default CvAPI;
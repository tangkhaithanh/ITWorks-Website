import apiClient from "../../service/apiClient";
const AccountAPI = {
    // 📄 Danh sách tài khoản (có search, lọc, phân trang)
    getAll: (params) =>
        apiClient.get("/accounts", { params }),

    // 🔍 Chi tiết tài khoản
    getDetail: (id) =>
        apiClient.get(`/accounts/${id}`),

    // ➕ Tạo tài khoản admin
    createAdmin: (data) =>
        apiClient.post("/accounts/create-admin", data),

    // 🔐 Khóa tài khoản
    ban: (id) =>
        apiClient.patch(`/accounts/${id}/ban`),

    // 🔓 Mở khóa (kích hoạt)
    activate: (id) =>
        apiClient.patch(`/accounts/${id}/activate`),

    // 🕗 Chuyển về chờ duyệt
    setPending: (id) =>
        apiClient.patch(`/accounts/${id}/pending`),

    // 🔁 Reset mật khẩu (gửi mật khẩu tạm qua email)
    resetPassword: (id) =>
        apiClient.patch(`/accounts/${id}/reset-password`),

    // 🗑️ Xóa tài khoản (nếu bạn có API xóa mềm)
    delete: (id) =>
        apiClient.delete(`/accounts/${id}`),
};

export default AccountAPI;
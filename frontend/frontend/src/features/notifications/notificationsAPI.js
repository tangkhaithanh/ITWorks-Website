import apiClient from "../../service/apiClient";

const NotificationsAPI = {
  getMyNotifications: (params = {}) =>
    apiClient.get("/notifications/my", { params }),

  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () => apiClient.patch("/notifications/read-all"),
};

export default NotificationsAPI;
import { io } from "socket.io-client";

let socket = null;

export function getNotificationsSocket() {
    if (socket) return socket;

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    socket = io(`${baseUrl}/notifications`, {
        transports: ["websocket"],
        withCredentials: true, // ✅ cookie access_token sẽ tự gửi kèm
        autoConnect: false,
    });

    return socket;
}

export function disconnectNotificationsSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

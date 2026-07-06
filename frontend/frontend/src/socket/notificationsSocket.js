import { io } from "socket.io-client";

let socket = null;

export function getNotificationsSocket() {
    if (socket) return socket;

    const baseUrl = import.meta.env.VITE_SOCKET_URL ;

    socket = io(`${baseUrl}/notifications`, {
        path: "/socket.io",
        transports: ["websocket"],
        withCredentials: true,
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

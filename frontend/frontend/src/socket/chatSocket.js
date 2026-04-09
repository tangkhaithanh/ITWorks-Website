import { io } from "socket.io-client";

let socket = null;

export function getChatSocket() {
  if (socket) return socket;

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  socket = io(`${baseUrl}/chat`, {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false,
  });

  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

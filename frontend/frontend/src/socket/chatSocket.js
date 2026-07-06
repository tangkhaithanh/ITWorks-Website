import { io } from "socket.io-client";

let socket = null;

export function getChatSocket() {
  if (socket) return socket;

  const baseUrl = import.meta.env.VITE_SOCKET_URL ;

  socket = io(`${baseUrl}/chat`, {
    path: "/socket.io",
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

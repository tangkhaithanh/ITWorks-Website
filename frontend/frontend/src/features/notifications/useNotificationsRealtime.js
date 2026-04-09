import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

import {
    getNotificationsSocket,
    disconnectNotificationsSocket,
} from "@/socket/notificationsSocket";
import {
    pushNotification,
    resetNotifications,
} from "./notificationsSlice";

/**
 * Realtime notifications – dùng cho MỌI ROLE
 * Backend quyết định gửi cho ai (room account:<id>)
 */
export default function useNotificationsRealtime() {
    const dispatch = useDispatch();

    const user = useSelector((state) => state.auth.user);
    const role = user?.role;
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!user) return;

        const socket = getNotificationsSocket();

        const onConnect = () => {
            console.log("✅ WS connected:", socket.id, "| role:", role);
        };

        const onNotification = (data) => {
            /**
             * data:
             * { id, type, message, is_read, created_at, payload }
             */

            // 1️⃣ lưu redux
            dispatch(pushNotification(data));

            const isMessage = data?.type === "message";
            const to = role === "recruiter" ? "/recruiter/messages" : "/messages";
            const isOnMessagesPage = location?.pathname?.startsWith(to);

            // 2️⃣ toast
            toast.success(data.message, {
                icon: isMessage ? "💬" : "🔔",
                duration: 4000,
                onClick: () => {
                    if (!isMessage) return;
                    if (isOnMessagesPage) return;

                    navigate(to, {
                        state: {
                            openConversationId: data?.payload?.conversationId || null,
                        },
                    });
                },
            });
        };

        socket.on("connect", onConnect);
        socket.on("notification:new", onNotification);

        if (!socket.connected) socket.connect();

        return () => {
            socket.off("connect", onConnect);
            socket.off("notification:new", onNotification);
        };
    }, [user, role, dispatch, navigate, location]);

    useEffect(() => {
        if (!user) {
            dispatch(resetNotifications());
            disconnectNotificationsSocket();
        }
    }, [user, dispatch]);
}

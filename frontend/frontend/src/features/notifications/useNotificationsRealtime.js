import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

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

            // 2️⃣ toast (role nào cũng được)
            toast.success(data.message, {
                icon: "🔔",
            });
        };

        socket.on("connect", onConnect);
        socket.on("notification:new", onNotification);

        if (!socket.connected) socket.connect();

        return () => {
            socket.off("connect", onConnect);
            socket.off("notification:new", onNotification);
        };
    }, [user, role, dispatch]);

    useEffect(() => {
        if (!user) {
            dispatch(resetNotifications());
            disconnectNotificationsSocket();
        }
    }, [user, dispatch]);
}

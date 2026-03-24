import { Bell } from "lucide-react";
import { useMemo } from "react";
import { useSelector } from "react-redux";

export default function NotificationBell({ onNotificationClick }) {
  const items = useSelector((state) => state.notifications?.items || []);
  const unread = useSelector((state) => state.notifications?.unread || 0);

  const latestNotification = useMemo(() => items[0] || null, [items]);

  return (
    <button
      type="button"
      title="Thông báo"
      aria-label="Thông báo"
      className="relative p-2 rounded-full hover:bg-slate-100"
      onClick={() => {
        if (latestNotification && typeof onNotificationClick === "function") {
          onNotificationClick(latestNotification);
        }
      }}
    >
      <Bell className="w-6 h-6 text-slate-600 hover:text-blue-600" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] leading-[18px] text-center font-semibold">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}

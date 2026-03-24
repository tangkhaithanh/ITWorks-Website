import { NOTIFICATION_TABS } from "@/features/notifications/notifications.types";

export default function NotificationTabs({
  activeTab,
  onChange,
  unreadCount = 0,
}) {
  const isAllActive = activeTab === NOTIFICATION_TABS.ALL;
  const isUnreadActive = activeTab === NOTIFICATION_TABS.UNREAD;

  return (
    <div className="px-4 pt-3">
      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => onChange(NOTIFICATION_TABS.ALL)}
          className={[
            "rounded-lg px-3 py-2 text-sm font-semibold transition-all",
            isAllActive
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          ].join(" ")}
        >
          Tất cả
        </button>

        <button
          type="button"
          onClick={() => onChange(NOTIFICATION_TABS.UNREAD)}
          className={[
            "rounded-lg px-3 py-2 text-sm font-semibold transition-all",
            "flex items-center justify-center gap-2",
            isUnreadActive
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          ].join(" ")}
        >
          <span>Chưa đọc</span>

          {unreadCount > 0 && (
            <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
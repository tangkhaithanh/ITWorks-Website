
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";

import useNotificationsDropdown from "@/features/notifications/useNotificationsDropdown";
import { NOTIFICATION_TABS } from "@/features/notifications/notifications.types";
import NotificationsDropdown from "./NotificationsDropdown";

export default function NotificationBell({
  onNotificationClick,
  className = "",
}) {
  const rootRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(NOTIFICATION_TABS.ALL);

  const {
    items,
    unread,
    initialized,
    loading,
    loadingMore,
    error,
    hasMore,
    processingIds,
    markingAll,
    fetchInitial,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotificationsDropdown({
    fetchOnMount: true,
    limit: 10,
  });

  const filteredItems = useMemo(() => {
    if (activeTab === NOTIFICATION_TABS.UNREAD) {
      return items.filter((item) => !item.is_read);
    }
    return items;
  }, [activeTab, items]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const handleToggle = async () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);

    if (nextOpen && !initialized) {
      await fetchInitial({ silent: false, preserveExisting: true });
    }
  };

  const handleItemClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (onNotificationClick) {
      await onNotificationClick(notification);
    }
  };

  return (
    <div ref={rootRef} className={`relative z-[110] ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className={[
          "relative rounded-xl p-2 text-slate-600 transition",
          isOpen ? "bg-slate-100 text-slate-900" : "hover:bg-slate-100",
        ].join(" ")}
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5" />

        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-sm">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      <NotificationsDropdown
        isOpen={isOpen}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        unreadCount={unread}
        items={filteredItems}
        loading={loading}
        error={error}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onRetry={() => fetchInitial({ silent: false, preserveExisting: true })}
        onLoadMore={loadMore}
        onMarkAllAsRead={markAllAsRead}
        onItemClick={handleItemClick}
        processingIds={processingIds}
        markingAll={markingAll}
      />
    </div>
  );
}
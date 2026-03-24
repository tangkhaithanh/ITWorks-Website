import { CheckCheck, Loader2 } from "lucide-react";
import NotificationTabs from "./NotificationTabs";
import NotificationList from "./NotificationList";

export default function NotificationsDropdown({
  isOpen,
  activeTab,
  onChangeTab,
  unreadCount,
  items,
  loading,
  error,
  loadingMore,
  hasMore,
  onRetry,
  onLoadMore,
  onMarkAllAsRead,
  onItemClick,
  processingIds,
  markingAll,
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full z-[120] mt-3 w-[min(92vw,400px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Thông báo</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Cập nhật nhanh các hoạt động quan trọng
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            disabled={markingAll}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {markingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Tabs */}
      <NotificationTabs
        activeTab={activeTab}
        onChange={onChangeTab}
        unreadCount={unreadCount}
      />

      {/* List */}
      <div className="mt-3 max-h-[420px] overflow-y-auto">
        <NotificationList
          items={items}
          loading={loading}
          error={error}
          activeTab={activeTab}
          processingIds={processingIds}
          onRetry={onRetry}
          onItemClick={onItemClick}
        />
      </div>

      {/* Footer */}
      {!loading && !error && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
          {hasMore ? (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
              {loadingMore ? "Đang tải thêm..." : "Xem thêm thông báo"}
            </button>
          ) : items.length > 0 ? (
            <p className="text-center text-xs font-medium text-slate-400">
              Bạn đã xem hết thông báo
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
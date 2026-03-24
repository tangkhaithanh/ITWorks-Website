import { BellRing, RefreshCcw } from "lucide-react";
import NotificationItem from "./NotificationItem";

function LoadingState() {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-slate-100 bg-white p-3"
        >
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-200" />
            <div className="flex-1">
              <div className="mb-2 h-3 w-24 rounded bg-slate-200" />
              <div className="mb-2 h-3 w-full rounded bg-slate-200" />
              <div className="h-3 w-4/5 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <BellRing className="h-5 w-5" />
      </div>

      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="px-4 py-10 text-center">
      <div className="mx-auto max-w-[280px]">
        <h4 className="text-sm font-semibold text-slate-800">
          Không thể tải thông báo
        </h4>
        <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    </div>
  );
}

export default function NotificationList({
  items = [],
  loading = false,
  error = "",
  activeTab,
  processingIds = {},
  onRetry,
  onItemClick,
}) {
  if (loading) return <LoadingState />;

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (!items.length) {
    return (
      <EmptyState
        title={
          activeTab === "unread"
            ? "Không có thông báo chưa đọc"
            : "Chưa có thông báo nào"
        }
        description={
          activeTab === "unread"
            ? "Mọi thông báo của bạn hiện đã được đọc."
            : "Các sự kiện quan trọng trong hệ thống tuyển dụng sẽ xuất hiện tại đây."
        }
      />
    );
  }

  return (
    <div>
      {items.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          processing={Boolean(processingIds[String(notification.id)])}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
}
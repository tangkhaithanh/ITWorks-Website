import { Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/features/notifications/notificationUtils";
import { getNotificationTypeMeta } from "@/features/notifications/notificationMeta";

export default function NotificationItem({
  notification,
  onClick,
  processing = false,
}) {
  const meta = getNotificationTypeMeta(notification.type);
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={[
        "w-full border-b border-slate-100 px-4 py-3 text-left transition-all last:border-b-0",
        "hover:bg-slate-50",
        !notification.is_read ? "bg-blue-50/40" : "bg-white",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
            meta.iconClassName,
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={[
                  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  meta.pillClassName,
                ].join(" ")}
              >
                {meta.label}
              </span>

              {!notification.is_read && (
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
              )}
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              {processing && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
              )}

              <span className="text-xs text-slate-400">
                {formatRelativeTime(notification.created_at)}
              </span>
            </div>
          </div>

          <p
            className="mt-2 text-sm leading-6 text-slate-700"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {notification.message}
          </p>
        </div>
      </div>
    </button>
  );
}
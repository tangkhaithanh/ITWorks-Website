
const rtf = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });

export function normalizeNotification(item = {}) {
  return {
    id: item?.id != null ? String(item.id) : "",
    account_id: item?.account_id != null ? String(item.account_id) : null,
    type: item?.type || "system",
    message: item?.message || "",
    is_read: Boolean(item?.is_read),
    created_at: item?.created_at
      ? new Date(item.created_at).toISOString()
      : new Date().toISOString(),
    updated_at: item?.updated_at
      ? new Date(item.updated_at).toISOString()
      : item?.created_at
      ? new Date(item.created_at).toISOString()
      : new Date().toISOString(),
    payload: item?.payload ?? null,
  };
}

export function mergeNotifications(existing = [], incoming = []) {
  const map = new Map();

  [...existing, ...incoming].forEach((rawItem) => {
    const item = normalizeNotification(rawItem);
    if (!item.id) return;
    map.set(item.id, item);
  });

  return Array.from(map.values()).sort((a, b) => {
    const timeDiff =
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

    if (Number.isFinite(timeDiff) && timeDiff !== 0) return timeDiff;

    return String(b.id).localeCompare(String(a.id), undefined, {
      numeric: true,
    });
  });
}

export function countUnread(items = []) {
  return items.filter((item) => !item.is_read).length;
}

export function normalizeNotificationsResponse(response) {
  const payload = response?.data?.data ?? {};

  return {
    items: Array.isArray(payload?.items)
      ? payload.items.map(normalizeNotification)
      : [],
    nextCursor: payload?.nextCursor ? String(payload.nextCursor) : null,
    hasMore: Boolean(payload?.hasMore),
  };
}

export function formatRelativeTime(input) {
  if (!input) return "Vừa xong";

  const now = Date.now();
  const target = new Date(input).getTime();

  if (!Number.isFinite(target)) return "Vừa xong";

  const diffInSeconds = Math.round((target - now) / 1000);
  const abs = Math.abs(diffInSeconds);

  if (abs < 60) return "Vừa xong";

  if (abs < 3600) return rtf.format(Math.round(diffInSeconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffInSeconds / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diffInSeconds / 86400), "day");

  return new Date(input).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getApiErrorMessage(error, fallback = "Có lỗi xảy ra") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}
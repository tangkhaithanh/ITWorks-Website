const toTimestamp = (value) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export const normalizeNotification = (item = {}) => ({
  ...item,
  id: item?.id ?? "",
  message: item?.message ?? "",
  is_read: Boolean(item?.is_read),
  created_at: item?.created_at ?? new Date().toISOString(),
});

export const mergeNotifications = (current = [], incoming = []) => {
  const map = new Map();

  [...current, ...incoming]
    .map((item) => normalizeNotification(item))
    .forEach((item) => {
      if (!item.id) return;
      const key = String(item.id);
      map.set(key, { ...(map.get(key) || {}), ...item });
    });

  return Array.from(map.values()).sort(
    (a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at)
  );
};

export const countUnread = (items = []) =>
  items.reduce((count, item) => count + (item?.is_read ? 0 : 1), 0);

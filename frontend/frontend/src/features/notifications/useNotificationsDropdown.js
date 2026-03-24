import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import NotificationsAPI from "./notificationsAPI";
import {
  appendNotifications,
  hydrateNotifications,
  markAllRead,
  markNotificationReadLocal,
  replaceNotificationsState,
  setNotificationReadState,
} from "./notificationsSlice";
import {
  DEFAULT_NOTIFICATIONS_LIMIT,
} from "./notifications.types";
import {
  getApiErrorMessage,
  normalizeNotificationsResponse,
} from "./notificationUtils";

export default function useNotificationsDropdown(options = {}) {
  const {
    limit = DEFAULT_NOTIFICATIONS_LIMIT,
    fetchOnMount = true,
  } = options;

  const dispatch = useDispatch();
  const notificationsState = useSelector((state) => state.notifications);

  const { items, unread, nextCursor, hasMore, initialized } = notificationsState;

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [processingIds, setProcessingIds] = useState({});
  const [markingAll, setMarkingAll] = useState(false);

  const fetchInitial = useCallback(
    async ({ silent = false, preserveExisting = true } = {}) => {
      try {
        if (!silent) setLoading(true);
        setError("");

        const response = await NotificationsAPI.getMyNotifications({ limit });
        const normalized = normalizeNotificationsResponse(response);

        dispatch(
          hydrateNotifications({
            ...normalized,
            preserveExisting,
          })
        );
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          "Không thể tải danh sách thông báo"
        );

        setError(message);

        if (!silent) {
          toast.error(message);
        }
      } finally {
        setLoading(false);
      }
    },
    [dispatch, limit]
  );

  useEffect(() => {
    if (!fetchOnMount || initialized) return;
    fetchInitial({ silent: true, preserveExisting: true });
  }, [fetchOnMount, initialized, fetchInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursor) return;

    try {
      setLoadingMore(true);

      const response = await NotificationsAPI.getMyNotifications({
        limit,
        cursor: nextCursor,
      });

      const normalized = normalizeNotificationsResponse(response);

      dispatch(appendNotifications(normalized));
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tải thêm thông báo")
      );
    } finally {
      setLoadingMore(false);
    }
  }, [dispatch, hasMore, limit, loadingMore, nextCursor]);

  const markAsRead = useCallback(
    async (notificationId) => {
      const targetId = String(notificationId);
      const target = items.find((item) => String(item.id) === targetId);

      if (!target || target.is_read) return;

      setProcessingIds((prev) => ({ ...prev, [targetId]: true }));
      dispatch(markNotificationReadLocal(targetId));

      try {
        await NotificationsAPI.markAsRead(targetId);
      } catch (error) {
        dispatch(
          setNotificationReadState({
            id: targetId,
            is_read: false,
          })
        );

        toast.error(
          getApiErrorMessage(error, "Không thể đánh dấu đã đọc")
        );
      } finally {
        setProcessingIds((prev) => {
          const next = { ...prev };
          delete next[targetId];
          return next;
        });
      }
    },
    [dispatch, items]
  );

  const markAllAsRead = useCallback(async () => {
    if (markingAll || unread <= 0) return;

    const snapshot = items.map((item) => ({ ...item }));

    setMarkingAll(true);
    dispatch(markAllRead());

    try {
      await NotificationsAPI.markAllAsRead();
    } catch (error) {
      const status = error?.response?.status;
      const message = getApiErrorMessage(
        error,
        "Không thể đánh dấu tất cả là đã đọc"
      );

      // Nếu backend trả 404 vì không còn unread thì vẫn xem như no-op hợp lệ
      if (status !== 404) {
        dispatch(
          replaceNotificationsState({
            items: snapshot,
            nextCursor,
            hasMore,
            initialized: true,
          })
        );
        toast.error(message);
      }
    } finally {
      setMarkingAll(false);
    }
  }, [dispatch, hasMore, items, markingAll, nextCursor, unread]);

  return {
    items,
    unread,
    nextCursor,
    hasMore,
    initialized,

    loading,
    loadingMore,
    error,
    processingIds,
    markingAll,

    fetchInitial,
    loadMore,
    markAsRead,
    markAllAsRead,
  };
}
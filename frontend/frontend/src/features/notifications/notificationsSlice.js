import { createSlice } from "@reduxjs/toolkit";
import {
  countUnread,
  mergeNotifications,
  normalizeNotification,
} from "./notificationUtils";
import { logout } from "@/features/auth/authSlice";
const initialState = {
  items: [],
  unread: 0,
  nextCursor: null,
  hasMore: false,
  initialized: false,
};

const syncUnread = (state) => {
  state.unread = countUnread(state.items);
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    hydrateNotifications(state, action) {
      const {
        items = [],
        nextCursor = null,
        hasMore = false,
        preserveExisting = false,
      } = action.payload || {};

      state.items = preserveExisting
        ? mergeNotifications(state.items, items)
        : mergeNotifications([], items);

      state.nextCursor = nextCursor;
      state.hasMore = hasMore;
      state.initialized = true;
      syncUnread(state);
    },

    appendNotifications(state, action) {
      const { items = [], nextCursor = null, hasMore = false } =
        action.payload || {};

      state.items = mergeNotifications(state.items, items);
      state.nextCursor = nextCursor;
      state.hasMore = hasMore;
      state.initialized = true;
      syncUnread(state);
    },

    pushNotification(state, action) {
      const item = normalizeNotification(action.payload);
      if (!item.id) return;

      state.items = mergeNotifications([item], state.items);
      syncUnread(state);
    },

    markNotificationReadLocal(state, action) {
      const targetId = String(action.payload);

      state.items = state.items.map((item) =>
        String(item.id) === targetId ? { ...item, is_read: true } : item
      );

      syncUnread(state);
    },

    setNotificationReadState(state, action) {
      const { id, is_read } = action.payload || {};
      const targetId = String(id);

      state.items = state.items.map((item) =>
        String(item.id) === targetId ? { ...item, is_read: Boolean(is_read) } : item
      );

      syncUnread(state);
    },

    markAllRead(state) {
      state.items = state.items.map((item) => ({ ...item, is_read: true }));
      syncUnread(state);
    },

    replaceNotificationsState(state, action) {
      const {
        items = [],
        nextCursor = null,
        hasMore = false,
        initialized = true,
      } = action.payload || {};

      state.items = mergeNotifications([], items);
      state.nextCursor = nextCursor;
      state.hasMore = hasMore;
      state.initialized = initialized;
      syncUnread(state);
    },

    resetNotifications() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout.fulfilled, () => initialState);
  },
});

export const {
  hydrateNotifications,
  appendNotifications,
  pushNotification,
  markNotificationReadLocal,
  setNotificationReadState,
  markAllRead,
  replaceNotificationsState,
  resetNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
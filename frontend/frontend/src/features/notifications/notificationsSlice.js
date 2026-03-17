import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    items: [],
    unread: 0,
};

const notificationsSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {
        pushNotification(state, action) {
            state.items.unshift(action.payload);
            if (!action.payload?.is_read) state.unread += 1;
        },
        markAllRead(state) {
            state.items = state.items.map((n) => ({ ...n, is_read: true }));
            state.unread = 0;
        },
        resetNotifications(state) {
            state.items = [];
            state.unread = 0;
        },
    },
});

export const { pushNotification, markAllRead, resetNotifications } =
    notificationsSlice.actions;

export default notificationsSlice.reducer;

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  unread: 0,
};

const messagingSlice = createSlice({
  name: "messaging",
  initialState,
  reducers: {
    incrementUnread(state) {
      state.unread += 1;
    },
    resetUnread() {
      return initialState;
    },
    setUnread(state, action) {
      const value = Number(action.payload ?? 0);
      state.unread = Number.isNaN(value) ? 0 : Math.max(0, value);
    },
  },
});

export const { incrementUnread, resetUnread, setUnread } = messagingSlice.actions;

export default messagingSlice.reducer;


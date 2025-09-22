import { createSlice } from "@reduxjs/toolkit";

const modalMessageSlice = createSlice({
  name: "modalMessage",
  initialState: {
    status: false,
    title: "",
    message: "",
  },
  reducers: {
    open(state) {
      state.status = true;
    },
    close(state) {
      state.status = false;
      state.title = "";
      state.message = "";
    },
    setMessage(state, action) {
      state.title = action.payload.title;
      state.message = action.payload.message;
    },
  },
});

export const modalMessageActions = modalMessageSlice.actions;

export default modalMessageSlice;

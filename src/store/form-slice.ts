import { createSlice } from "@reduxjs/toolkit";

const formSlice = createSlice({
  name: "form",
  initialState: {
    status: false,
    submitting: false,
    sending: false,
  },
  reducers: {
    open(state) {
      state.status = true;
    },
    reset(state) {
      state.status = false;
      state.submitting = false;
    },
    setSubmitting(state) {
      state.submitting = true;
    },
    resetSubmitting(state) {
      state.submitting = false;
    },
    setSending(state) {
      state.sending = true;
    },
    resetSending(state) {
      state.sending = false;
    },
  },
});

export const formActions = formSlice.actions;

export default formSlice;

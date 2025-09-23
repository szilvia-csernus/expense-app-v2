import { configureStore } from "@reduxjs/toolkit";
import formSlice from "./form-slice";
import churchSlice from "./church-slice";

import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";
import modalMessageSlice from "./modal-message-slice";

const store = configureStore({
  reducer: {
    church: churchSlice.reducer,
    form: formSlice.reducer,
    modalMessage: modalMessageSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;

export default store;

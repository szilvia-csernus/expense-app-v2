import { type AppDispatch } from "../store";
import { type Action } from "redux";

/** Dispatch the callback function after 10s delay. */
export function callAfterTimeout(
  dispatch: AppDispatch,
  callback: () => Action
) {
  const timeoutId = setTimeout(() => {
    dispatch(callback());
  }, 10000);

  return () => clearTimeout(timeoutId);
}

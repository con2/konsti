import { t } from "i18next";
import { BackendErrorType } from "client/utils/api";
import { AppDispatch } from "client/types/reduxTypes";
import { store } from "client/utils/store";
import { removeError } from "client/views/admin/adminSlice";

export const resetNetworkError = (): void => {
  const dispatch: AppDispatch = store.dispatch;
  dispatch(removeError(t(BackendErrorType.NETWORK_ERROR)));
};

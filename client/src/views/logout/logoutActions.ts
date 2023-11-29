import { clearSession } from "client/utils/localStorage";
import {
  SubmitLogout,
  SUBMIT_LOGOUT,
} from "client/types/logoutActionsTypes";

export const submitLogout = (): SubmitLogout => {
  clearSession();
  return {
    type: SUBMIT_LOGOUT,
  };
};

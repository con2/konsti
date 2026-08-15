import { SUBMIT_LOGOUT, SubmitLogout } from "client/types/logoutActionsTypes";
import { clearSession } from "client/utils/localStorage";

export const submitLogout = (): SubmitLogout => {
  clearSession();
  return {
    type: SUBMIT_LOGOUT,
  };
};

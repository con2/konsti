import { clearSession } from 'utils/localStorage';
import { SubmitLogout, SUBMIT_LOGOUT } from 'typings/logoutActions.typings';

export const submitLogout = (): SubmitLogout => {
  clearSession();
  return {
    type: SUBMIT_LOGOUT,
  };
};

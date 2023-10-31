import { ReactElement, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { submitLogout } from "client/views/logout/logoutActions";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { postKompassiLogoutRedirect } from "client/services/loginServices";
import { LoginProvider } from "shared/config/sharedConfigTypes";
import { Loading } from "client/components/Loading";

export const LogoutView = (): ReactElement => {
  const dispatch = useAppDispatch();
  const loginProvider = useAppSelector((state) => state.admin.loginProvider);
  const isLocalLogin = loginProvider === LoginProvider.LOCAL;

  useEffect(() => {
    const doKompassiLogout = async (): Promise<void> => {
      await postKompassiLogoutRedirect();
    };

    if (isLocalLogin) {
      dispatch(submitLogout());
    } else {
      doKompassiLogout();
    }
  }, [dispatch, isLocalLogin]);

  return (
    <>
      {isLocalLogin && <Navigate to="/program" replace />}
      {!isLocalLogin && <Loading />}
    </>
  );
};

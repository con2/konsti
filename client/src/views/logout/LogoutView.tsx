import { ReactElement, useEffect } from "react";
import { Navigate } from "react-router";
import { submitLogout } from "client/views/logout/logoutActions";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { postKompassiLogoutRedirect } from "client/services/loginServices";
import { Loading } from "client/components/Loading";
import { UserGroup } from "shared/types/models/user";
import { AppRoute } from "client/app/AppRoutes";

export const LogoutView = (): ReactElement => {
  const dispatch = useAppDispatch();
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const kompassiId = useAppSelector((state) => state.login.kompassiId);
  const isLocalLogin = !kompassiId;

  useEffect(() => {
    const doKompassiLogout = async (): Promise<void> => {
      await postKompassiLogoutRedirect();
    };

    if (isLocalLogin || userGroup === UserGroup.ADMIN) {
      dispatch(submitLogout());
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      doKompassiLogout();
    }
  }, [dispatch, isLocalLogin, userGroup]);

  return (
    <>
      {isLocalLogin && <Navigate to={AppRoute.PROGRAM} replace />}
      {!isLocalLogin && <Loading />}
    </>
  );
};

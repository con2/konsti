import { ReactElement, useEffect } from "react";
import { Navigate } from "react-router";
import { AppRoute } from "client/app/routes";
import { useAppDispatch } from "client/utils/hooks";
import { submitLogout } from "client/views/logout/logoutActions";

export const KompassiLogoutCallback = (): ReactElement => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(submitLogout());
  });

  return <Navigate to={AppRoute.ROOT} replace />;
};

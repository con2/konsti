import { ReactElement, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { submitLogout } from "client/views/logout/logoutActions";
import { useAppDispatch } from "client/utils/hooks";
import { AppRoute } from "client/app/AppRoutes";

export const KompassiLogoutCallback = (): ReactElement => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(submitLogout());
  });

  return <Navigate to={AppRoute.ROOT} replace />;
};

import React, { ReactElement, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { submitLogout } from "client/views/logout/logoutActions";
import { useAppDispatch } from "client/utils/hooks";

export const LogoutView = (): ReactElement<typeof Navigate> => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(submitLogout());
  });

  return <Navigate to="/" replace />;
};

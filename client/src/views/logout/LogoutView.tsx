import React, { ReactElement, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { submitLogout } from 'client/views/logout/logoutActions';
import { useAppDispatch } from 'client/utils/hooks';

export const LogoutView = (): ReactElement<typeof Redirect> => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(submitLogout());
  });

  return <Redirect to='/' />;
};

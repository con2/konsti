import React, { FC, ReactElement } from 'react';
import { useDispatch } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { submitLogout } from 'views/logout/logoutActions';

export const LogoutView: FC = (): ReactElement<typeof Redirect> => {
  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(submitLogout());
  });

  return <Redirect to='/' />;
};

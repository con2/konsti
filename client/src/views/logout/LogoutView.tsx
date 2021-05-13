import React, { FC, ReactElement } from 'react';
import { Redirect } from 'react-router-dom';
import { submitLogout } from 'client/views/logout/logoutActions';
import { useAppDispatch } from 'client/utils/hooks';

export const LogoutView: FC = (): ReactElement<typeof Redirect> => {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    dispatch(submitLogout());
  });

  return <Redirect to='/' />;
};

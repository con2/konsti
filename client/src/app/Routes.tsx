import React, { FC, ReactElement } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { AllGamesView } from 'views/all-games/AllGamesView';
import { GameDetails } from 'views/all-games/components/GameDetails';
import { LoginView } from 'views/login/LoginView';
import { MyGamesView } from 'views/my-games/MyGamesView';
import { SignupView } from 'views/signup/SignupView';
import { RegistrationView } from 'views/registration/RegistrationView';
import { AdminView } from 'views/admin/AdminView';
import { ResultsView } from 'views/results/ResultsView';
import { LogoutView } from 'views/logout/LogoutView';
import { GroupView } from 'views/group/GroupView';
import { HelperView } from 'views/helper/HelperView';
import { RootState } from 'typings/redux.typings';

export interface Props {
  onlyAdminLoginAllowed: boolean;
}

export const Routes: FC<Props> = (props: Props): ReactElement => {
  const { onlyAdminLoginAllowed } = props;
  const loggedIn: boolean = useSelector(
    (state: RootState) => state.login.loggedIn
  );

  if (onlyAdminLoginAllowed) {
    return (
      <>
        <Switch>
          <Route path='/admin'>
            <AdminView />
          </Route>
          <Route path='/logout'>
            <LogoutView />
          </Route>
          <Redirect from='/*' to='/' />
        </Switch>
      </>
    );
  }

  if (loggedIn) {
    return (
      <ContentContainer>
        <Switch>
          <Route path='/games/:gameId'>
            <GameDetails />
          </Route>
          <Route path='/games'>
            <AllGamesView />
          </Route>
          <Route path='/mygames'>
            <MyGamesView />
          </Route>
          <Route path='/signup'>
            <SignupView />
          </Route>
          <Route path='/results'>
            <ResultsView />
          </Route>
          <Route path='/group'>
            <GroupView />
          </Route>
          <Route path='/admin'>
            <AdminView />
          </Route>
          <Route path='/logout'>
            <LogoutView />
          </Route>
          <Route path='/help'>
            <HelperView />
          </Route>
          <Redirect from='/' to='/games' />
          <Redirect from='/*' to='/' />
        </Switch>
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <Switch>
        <Route path='/login'>
          <LoginView />
        </Route>
        <Route path='/registration'>
          <RegistrationView />
        </Route>
        <Route path='/games/:gameId'>
          <GameDetails />
        </Route>
        <Route path='/games'>
          <AllGamesView />
        </Route>
        <Redirect from='/' to='/games' />
        <Redirect from='/*' to='/login' />
      </Switch>
    </ContentContainer>
  );
};

const ContentContainer = styled.div`
  padding: 0 30px;
`;

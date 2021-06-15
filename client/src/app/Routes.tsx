import React, { ReactElement } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import styled from 'styled-components';
import { AllGamesView } from 'client/views/all-games/AllGamesView';
import { GameDetails } from 'client/views/all-games/components/GameDetails';
import { LoginView } from 'client/views/login/LoginView';
import { MyGamesView } from 'client/views/my-games/MyGamesView';
import { SignupView } from 'client/views/signup/SignupView';
import { RegistrationView } from 'client/views/registration/RegistrationView';
import { AdminView } from 'client/views/admin/AdminView';
import { ResultsView } from 'client/views/results/ResultsView';
import { LogoutView } from 'client/views/logout/LogoutView';
import { GroupView } from 'client/views/group/GroupView';
import { HelperView } from 'client/views/helper/HelperView';
import { useAppSelector } from 'client/utils/hooks';

export interface Props {
  onlyAdminLoginAllowed: boolean;
}

export const Routes = ({ onlyAdminLoginAllowed }: Props): ReactElement => {
  const loggedIn = useAppSelector((state) => state.login.loggedIn);

  if (onlyAdminLoginAllowed) {
    return (
      <Switch>
        <Route path='/admin'>
          <AdminView />
        </Route>
        <Route path='/logout'>
          <LogoutView />
        </Route>
        <Redirect from='/*' to='/' />
      </Switch>
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
  padding: 0;
`;

import React, { FC, ReactElement } from 'react';
import { Route, NavLink, Switch, Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
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
import { UserGroup } from 'typings/user.typings';
import { RootState } from 'typings/redux.typings';

export interface Props {
  onlyAdminLoginAllowed: boolean;
}

export const Routes: FC<Props> = (props: Props): ReactElement => {
  const { onlyAdminLoginAllowed } = props;
  const loggedIn: boolean = useSelector(
    (state: RootState) => state.login.loggedIn
  );
  const userGroup: UserGroup = useSelector(
    (state: RootState) => state.login.userGroup
  );
  const { t } = useTranslation();

  if (onlyAdminLoginAllowed) {
    if (!loggedIn) {
      return (
        <>
          <StyledRoutes>
            <RouterLink to='/login'>{t('button.login')}</RouterLink>
          </StyledRoutes>
          <Switch>
            <Route path='/login'>
              <LoginView />
            </Route>
            <Redirect from='/*' to='/' />
          </Switch>
        </>
      );
    }

    return (
      <>
        <StyledRoutes>
          {userGroup === 'admin' && (
            <RouterLink to='/admin'>{t('pages.admin')}</RouterLink>
          )}

          {(userGroup === 'user' || userGroup === 'admin') && (
            <RouterLink to='/logout'>{t('button.logout')}</RouterLink>
          )}
        </StyledRoutes>
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
      <>
        <StyledRoutes>
          <RouterLink to='/games'>{t('pages.allGames')}</RouterLink>

          {userGroup === 'user' && (
            <RouterLink to='/mygames'>{t('pages.myGames')}</RouterLink>
          )}

          {userGroup === 'user' && (
            <RouterLink to='/signup'>{t('pages.signUp')}</RouterLink>
          )}

          {(userGroup === 'user' ||
            userGroup === 'admin' ||
            userGroup === 'help') && (
            <RouterLink to='/results'>{t('pages.results')}</RouterLink>
          )}

          {userGroup === 'user' && (
            <RouterLink to='/group'>{t('pages.group')}</RouterLink>
          )}

          {(userGroup === 'help' || userGroup === 'admin') && (
            <RouterLink to='/help'>{t('button.helper')}</RouterLink>
          )}

          {userGroup === 'admin' && (
            <RouterLink to='/admin'>{t('pages.admin')}</RouterLink>
          )}

          {(userGroup === 'user' ||
            userGroup === 'admin' ||
            userGroup === 'help') && (
            <RouterLink to='/logout'>{t('button.logout')}</RouterLink>
          )}
        </StyledRoutes>
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
      </>
    );
  }

  return (
    <>
      <StyledRoutes>
        <RouterLink to='/games'>{t('pages.allGames')}</RouterLink>

        <RouterLink to='/login'>{t('button.login')}</RouterLink>

        <RouterLink to='/registration'>{t('button.register')}</RouterLink>
      </StyledRoutes>

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
    </>
  );
};

const StyledRoutes = styled.div`
  background-color: ${(props) => props.theme.backgroundHighlight};
  border-bottom: 1px solid ${(props) => props.theme.borderInactive};
`;

const RouterLink = styled(NavLink)`
  position: relative;
  display: inline-block;
  padding: 10px 12px 10px 12px;
  font-size: ${(props) => props.theme.linkFontSize};
  text-decoration: none;
  color: ${(props) => props.theme.mainText};

  :hover,
  :focus {
    background-color: ${(props) => props.theme.backgroundHover};
  }

  &.active {
    border: none;
  }

  &.active::after {
    background-color: ${(props) => props.theme.mainText};
    bottom: 0;
    content: '';
    display: block;
    height: 3px;
    left: 50%;
    margin-left: -30px;
    position: absolute;
    width: 60px;
  }
`;

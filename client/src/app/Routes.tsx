import React, { ReactElement } from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import { AllGamesView } from "client/views/all-games/AllGamesView";
import { GameDetails } from "client/views/all-games/components/GameDetails";
import { LoginView } from "client/views/login/LoginView";
import { MyGamesView } from "client/views/my-games/MyGamesView";
import { SignupView } from "client/views/signup/SignupView";
import { RegistrationView } from "client/views/registration/RegistrationView";
import { AdminView } from "client/views/admin/AdminView";
import { ResultsView } from "client/views/results/ResultsView";
import { LogoutView } from "client/views/logout/LogoutView";
import { GroupView } from "client/views/group/GroupView";
import { HelperView } from "client/views/helper/HelperView";
import { useAppSelector } from "client/utils/hooks";
import { sharedConfig } from "shared/config/sharedConfig";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { isAdmin, isAdminOrHelp } from "client/utils/checkUserGroup";

export const Routes = (): ReactElement => {
  const appOpen = useAppSelector((state) => state.admin.appOpen);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);

  if (!appOpen) {
    return (
      <Switch>
        {isAdmin(userGroup) && (
          <Route path="/admin">
            <AdminView />
          </Route>
        )}
        {isAdminOrHelp(userGroup) && (
          <Route path="/help">
            <HelperView />
          </Route>
        )}
        {isAdminOrHelp(userGroup) && (
          <Route path="/games/:gameId">
            <GameDetails />
          </Route>
        )}
        {isAdminOrHelp(userGroup) && (
          <Route path="/games">
            <AllGamesView />
          </Route>
        )}
        {isAdminOrHelp(userGroup) && (
          <Route path="/results">
            <ResultsView />
          </Route>
        )}
        {!loggedIn && (
          <Route path="/login">
            <LoginView />
          </Route>
        )}
        <Route path="/logout">
          <LogoutView />
        </Route>
        <Redirect from="/" to="/games" />
        <Redirect from="/*" to="/" />
      </Switch>
    );
  }

  if (loggedIn) {
    return (
      <Switch>
        <Route path="/games/:gameId">
          <GameDetails />
        </Route>
        <Route path="/games">
          <AllGamesView />
        </Route>
        <Route path="/mygames">
          <MyGamesView />
        </Route>
        {sharedConfig.signupStrategy === SignupStrategy.ALGORITHM && (
          <Route path="/signup">
            <SignupView />
          </Route>
        )}
        <Route path="/results">
          <ResultsView />
        </Route>
        {sharedConfig.enableGroups && (
          <Route path="/group">
            <GroupView />
          </Route>
        )}
        {isAdmin(userGroup) && (
          <Route path="/admin">
            <AdminView />
          </Route>
        )}
        <Route path="/logout">
          <LogoutView />
        </Route>
        {isAdminOrHelp(userGroup) && (
          <Route path="/help">
            <HelperView />
          </Route>
        )}
        <Redirect from="/" to="/games" />
        <Redirect from="/*" to="/" />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        <LoginView />
      </Route>
      <Route path="/registration">
        <RegistrationView />
      </Route>
      <Route path="/games/:gameId">
        <GameDetails />
      </Route>
      <Route path="/games">
        <AllGamesView />
      </Route>
      <Redirect from="/" to="/games" />
      <Redirect from="/*" to="/login" />
    </Switch>
  );
};

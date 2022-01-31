import React, { ReactElement } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
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

export const AppRoutes = (): ReactElement => {
  const appOpen = useAppSelector((state) => state.admin.appOpen);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);

  if (!appOpen) {
    return (
      <Routes>
        {isAdmin(userGroup) && <Route path="/admin" element={<AdminView />} />}
        {isAdminOrHelp(userGroup) && (
          <Route path="/help" element={<HelperView />} />
        )}
        {isAdminOrHelp(userGroup) && (
          <Route path="/games/:gameId" element={<GameDetails />} />
        )}
        {isAdminOrHelp(userGroup) && (
          <Route path="/games" element={<AllGamesView />} />
        )}
        {isAdminOrHelp(userGroup) && (
          <Route path="/results" element={<ResultsView />} />
        )}
        {!loggedIn && <Route path="/login" element={<LoginView />} />}
        <Route path="/logout" element={<LogoutView />} />
        <Route path="/" element={<Navigate to="/games" />} />
        <Route path="/*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  if (loggedIn) {
    return (
      <Routes>
        <Route path="/games/:gameId" element={<GameDetails />} />
        <Route path="/games" element={<AllGamesView />} />
        <Route path="/mygames" element={<MyGamesView />} />
        {signupStrategy === SignupStrategy.ALGORITHM && (
          <Route path="/signup" element={<SignupView />} />
        )}
        <Route path="/results" element={<ResultsView />} />
        {sharedConfig.enableGroups && (
          <Route path="/group" element={<GroupView />} />
        )}
        {isAdmin(userGroup) && <Route path="/admin" element={<AdminView />} />}
        <Route path="/logout" element={<LogoutView />} />
        {isAdminOrHelp(userGroup) && (
          <Route path="/help" element={<HelperView />} />
        )}
        <Route path="/" element={<Navigate to="/games" />} />
        <Route path="/*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route path="/registration" element={<RegistrationView />} />
      <Route path="/games/:gameId" element={<GameDetails />} />
      <Route path="/games" element={<AllGamesView />} />
      <Route path="/" element={<Navigate to="/games" />} />
      <Route path="/*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

import { ReactElement } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconName } from "@fortawesome/free-solid-svg-icons";
import { AllGamesView } from "client/views/all-games/AllGamesView";
import { GameDetails } from "client/views/all-games/components/GameDetails";
import { LoginView } from "client/views/login/LoginView";
import { MyGamesView } from "client/views/my-games/MyGamesView";
import { RegistrationView } from "client/views/registration/RegistrationView";
import { AdminView } from "client/views/admin/AdminView";
import { ResultsView } from "client/views/results/ResultsView";
import { LogoutView } from "client/views/logout/LogoutView";
import { GroupView } from "client/views/group/GroupView";
import { HelperView } from "client/views/helper/HelperView";
import { useAppSelector } from "client/utils/hooks";
import { sharedConfig } from "shared/config/sharedConfig";
import { isAdmin, isAdminOrHelp } from "client/utils/checkUserGroup";
import { AboutView } from "client/views/about/AboutView";
import { FaqView } from "client/views/about/FaqView";
import { Tabs } from "client/components/Tabs";
import { EventLog } from "client/views/all-games/components/EventLog";

export const AppRoutes = (): ReactElement => {
  const { t } = useTranslation();

  const appOpen = useAppSelector((state) => state.admin.appOpen);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);

  const aboutTabs = [
    {
      headerText: t("aboutView.general"),
      path: "about",
      element: <AboutView />,
      icon: "info" as IconName,
    },
    {
      headerText: t("aboutView.faq"),
      path: "faq",
      element: <FaqView />,
      icon: "question" as IconName,
    },
  ];

  if (!appOpen) {
    return (
      <Routes>
        {isAdmin(userGroup) && <Route path="/admin" element={<AdminView />} />}
        {isAdminOrHelp(userGroup) && (
          <>
            <Route path="/help" element={<HelperView />} />
            <Route path="/games/:gameId" element={<GameDetails />} />
            <Route path="/games" element={<AllGamesView />} />
            <Route path="/results" element={<ResultsView />} />
          </>
        )}
        {!loggedIn && <Route path="/login" element={<LoginView />} />}
        <Route path="/logout" element={<LogoutView />} />
        <Route path="/about/*" element={<Tabs tabContents={aboutTabs} />} />
        <Route path="/" element={<div />} />
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
        <Route path="/notifications" element={<EventLog />} />
        <Route path="/results" element={<ResultsView />} />
        {sharedConfig.enableGroups && (
          <Route path="/group" element={<GroupView />} />
        )}
        {isAdmin(userGroup) && <Route path="/admin" element={<AdminView />} />}
        <Route path="/logout" element={<LogoutView />} />
        {/* Login path is required for after login redirect to work */}
        <Route path="/login" element={<LoginView />} />
        {isAdminOrHelp(userGroup) && (
          <Route path="/help" element={<HelperView />} />
        )}
        <Route path="/about/*" element={<Tabs tabContents={aboutTabs} />} />
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
      <Route path="/about/*" element={<Tabs tabContents={aboutTabs} />} />
      <Route path="/" element={<Navigate to="/games" />} />
      <Route path="/*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

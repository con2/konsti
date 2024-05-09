import { ReactElement } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconName } from "@fortawesome/free-solid-svg-icons";
import { AllProgramItemsView } from "client/views/all-program-items/AllProgramItemsView";
import { ProgramItemDetailsPage } from "client/views/all-program-items/components/ProgramItemDetailsPage";
import { LoginView } from "client/views/login/LoginView";
import { MyGamesView } from "client/views/my-games/MyGamesView";
import { RegistrationView } from "client/views/registration/RegistrationView";
import { AdminView } from "client/views/admin/AdminView";
import { ResultsView } from "client/views/results/ResultsView";
import { LogoutView } from "client/views/logout/LogoutView";
import { GroupView } from "client/views/group/GroupView";
import { HelperView } from "client/views/helper/HelperView";
import { useAppSelector } from "client/utils/hooks";
import { config } from "shared/config";
import { isAdmin, isAdminOrHelp } from "client/utils/checkUserGroup";
import { AboutView } from "client/views/about/AboutView";
import { FaqView } from "client/views/about/FaqView";
import { Tabs } from "client/components/Tabs";
import { EventLog } from "client/views/all-program-items/components/EventLog";
import { ProfileView } from "client/views/profile/ProfileView";
import { InstructionsView } from "client/views/about/InstructionsView";
import { KompassiLoginCallback } from "client/components/KompassiLoginCallback";
import { LoginProvider } from "shared/config/sharedConfigTypes";
import { KompassiLoginUsernameForm } from "client/views/login/components/KompassiLoginUsernameForm";
import { KompassiLogoutCallback } from "client/components/KompassiLogoutCallback";
import { AuthEndpoint } from "shared/constants/apiEndpoints";

export const AppRoutes = (): ReactElement => {
  const { t } = useTranslation();

  const appOpen = useAppSelector((state) => state.admin.appOpen);
  const loginProvider = useAppSelector((state) => state.admin.loginProvider);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const kompassiId = useAppSelector((state) => state.login.kompassiId);
  const kompassiUsernameAccepted = useAppSelector(
    (state) => state.login.kompassiUsernameAccepted,
  );

  const programTabs = [
    {
      headerText: t("pages.myProgram"),
      path: "myprogram",
      element: <MyGamesView />,
      icon: "dice" as IconName,
      "data-testid": "my-program-list",
    },
    {
      headerText: t("pages.programList"),
      path: "list",
      element: <AllProgramItemsView />,
      icon: "calendar-days" as IconName,
      "data-testid": "program-list",
    },
  ];

  const aboutTabs = [
    {
      headerText: t("aboutView.instructions"),
      path: "help",
      element: <InstructionsView />,
      icon: "person-chalkboard" as IconName,
    },
    {
      headerText: t("aboutView.faq"),
      path: "faq",
      element: <FaqView />,
      icon: "question" as IconName,
    },
    {
      headerText: t("aboutView.about"),
      path: "about",
      element: <AboutView />,
      icon: "info" as IconName,
    },
  ];

  const profileTabs = [
    {
      headerText: t("profileView.profileTab"),
      path: "profile",
      element: <ProfileView />,
      icon: "user" as IconName,
    },
    {
      headerText: t("profileView.groupTab"),
      path: "group",
      element: <GroupView />,
      icon: "users" as IconName,
    },
  ];

  if (!appOpen) {
    return (
      <Routes>
        {isAdmin(userGroup) && <Route path="/admin" element={<AdminView />} />}
        {isAdminOrHelp(userGroup) && (
          <>
            <Route path="/help" element={<HelperView />} />
            <Route
              path="/program/:programItemId"
              element={<ProgramItemDetailsPage />}
            />
            <Route
              path="/program"
              element={<Navigate replace to="/program/list" />}
            />
            <Route path="/program/list" element={<AllProgramItemsView />} />
            <Route path="/results" element={<ResultsView />} />
            <Route path="/profile" element={<ProfileView />} />
          </>
        )}
        {!loggedIn && <Route path="/login" element={<LoginView />} />}
        {!loggedIn && <Route path="/admin/login" element={<LoginView />} />}
        <Route path="/logout" element={<LogoutView />} />
        <Route path="/about/*" element={<Tabs tabContents={aboutTabs} />} />
        <Route path="/" element={<div />} />
        <Route path="/*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  if (loggedIn) {
    if (kompassiId !== 0 && !kompassiUsernameAccepted) {
      return (
        <Routes>
          <Route path="/logout" element={<LogoutView />} />
          <Route path="/*" element={<KompassiLoginUsernameForm />} />
        </Routes>
      );
    }

    return (
      <Routes>
        <Route
          path="/program/:programItemId"
          element={<ProgramItemDetailsPage />}
        />
        {isAdminOrHelp(userGroup) ? (
          <Route path="/program/list" element={<AllProgramItemsView />} />
        ) : (
          <Route
            path="/program/*"
            element={<Tabs tabContents={programTabs} />}
          />
        )}
        <Route path="/notifications" element={<EventLog />} />
        <Route path="/results" element={<ResultsView />} />
        {!isAdminOrHelp(userGroup) && config.shared().enableGroups ? (
          <Route
            path="/profile/*"
            element={<Tabs tabContents={profileTabs} />}
          />
        ) : (
          <Route path="/profile" element={<ProfileView />} />
        )}
        {isAdminOrHelp(userGroup) && (
          <Route path="/profile" element={<ProfileView />} />
        )}
        {isAdmin(userGroup) && <Route path="/admin" element={<AdminView />} />}
        <Route path="/logout" element={<LogoutView />} />
        <Route
          path={"/kompassi-logout-callback"}
          element={<KompassiLogoutCallback />}
        />
        {/* Login path is required for after login redirect to work */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/admin/login" element={<LoginView />} />
        {isAdminOrHelp(userGroup) && (
          <Route path="/help" element={<HelperView />} />
        )}
        <Route path="/about/*" element={<Tabs tabContents={aboutTabs} />} />
        {isAdminOrHelp(userGroup) ? (
          <Route path="/" element={<Navigate to="/program/list" />} />
        ) : (
          <Route path="/" element={<Navigate to="/program/myprogram" />} />
        )}
        <Route path="/*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route path="/admin/login" element={<LoginView />} />
      {loginProvider === LoginProvider.LOCAL && (
        <Route path="/registration" element={<RegistrationView />} />
      )}
      <Route
        path="/program/:programItemId"
        element={<ProgramItemDetailsPage />}
      />
      <Route
        path="/program"
        element={<Navigate replace to="/program/list" />}
      />
      <Route path="/program/list" element={<AllProgramItemsView />} />
      <Route path="/about/*" element={<Tabs tabContents={aboutTabs} />} />
      <Route path="/" element={<Navigate to="/program" />} />
      <Route
        path={AuthEndpoint.KOMPASSI_LOGIN_CALLBACK}
        element={<KompassiLoginCallback />}
      />
      <Route path="/*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

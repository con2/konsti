import { ReactElement } from "react";
import { Route, Routes, Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { IconName } from "@fortawesome/free-solid-svg-icons";
import { AllProgramItemsView } from "client/views/all-program-items/AllProgramItemsView";
import { ProgramItemView } from "client/views/program-item/ProgramItemView";
import { LoginView } from "client/views/login/LoginView";
import { MyProgramItemsView } from "client/views/my-program-items/MyProgramItemsView";
import { RegistrationView } from "client/views/registration/RegistrationView";
import { AdminView } from "client/views/admin/AdminView";
import { LogoutView } from "client/views/logout/LogoutView";
import { GroupView } from "client/views/group/GroupView";
import { HelperView } from "client/views/helper/HelperView";
import { useAppSelector } from "client/utils/hooks";
import { config } from "shared/config";
import { isAdmin, isAdminOrHelp } from "client/utils/checkUserGroup";
import { AboutView } from "client/views/about/AboutView";
import { FaqView } from "client/views/about/FaqView";
import { Tabs } from "client/components/Tabs";
import { EventLog } from "client/views/event-log/EventLog";
import { ProfileView } from "client/views/profile/ProfileView";
import { InstructionsView } from "client/views/about/InstructionsView";
import { KompassiLoginCallback } from "client/components/KompassiLoginCallback";
import { LoginProvider } from "shared/config/eventConfigTypes";
import { KompassiLoginUsernameForm } from "client/views/login/components/KompassiLoginUsernameForm";
import { KompassiLogoutCallback } from "client/components/KompassiLogoutCallback";
import { AuthEndpoint } from "shared/constants/apiEndpoints";
import { AdmissionTicketView } from "client/views/admission-ticket/AdmissionTicketView";

export enum AppRoute {
  ROOT = "/",
  PROGRAM = "/program",
  PROGRAM_ITEM = "/program/item",
  HELPER = "/helper",
  ADMIN = "/admin",
  ADMIN_LOGIN = "/admin/login",
  PROFILE = "/profile",
  REGISTRATION = "/registration",
  LOGIN = "/login",
  LOGOUT = "/logout",
  ABOUT = "/about",
  NOTIFICATIONS = "/notifications",
  KOMPASSI_LOGOUT_CALLBACK = "/kompassi-logout-callback",
  ANY = "/*",
}

export enum ProgramTab {
  MY_PROGRAM = "/program/myprogram",
  PROGRAM_LIST = "/program/list",
}

export enum AboutTab {
  HELP = "/about/help",
  FAQ = "/about/faq",
  ABOUT = "/about/about",
}

export enum ProfileTab {
  PROFILE = "/profile/profile",
  GROUP = "/profile/group",
}

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
      path: ProgramTab.MY_PROGRAM,
      element: <MyProgramItemsView />,
      icon: "dice" as IconName,
      "data-testid": "my-program-tab",
    },
    {
      headerText: t("pages.programList"),
      path: ProgramTab.PROGRAM_LIST,
      element: <AllProgramItemsView />,
      icon: "calendar-days" as IconName,
      "data-testid": "program-list-tab",
    },
  ];

  const aboutTabs = [
    {
      headerText: t("aboutView.instructions"),
      path: AboutTab.HELP,
      element: <InstructionsView />,
      icon: "person-chalkboard" as IconName,
    },
    {
      headerText: t("aboutView.faq"),
      path: AboutTab.FAQ,
      element: <FaqView />,
      icon: "question" as IconName,
    },
    {
      headerText: t("aboutView.about"),
      path: AboutTab.ABOUT,
      element: <AboutView />,
      icon: "info" as IconName,
    },
  ];

  const profileTabs = [
    {
      headerText: t("profileView.profileTab"),
      path: ProfileTab.PROFILE,
      element: <ProfileView />,
      icon: "user" as IconName,
    },
    {
      headerText: t("profileView.groupTab"),
      path: ProfileTab.GROUP,
      element: <GroupView />,
      icon: "users" as IconName,
    },
  ];

  if (!appOpen) {
    return (
      <Routes>
        {isAdmin(userGroup) && (
          <Route path={AppRoute.ADMIN} element={<AdminView />} />
        )}
        {isAdminOrHelp(userGroup) && (
          <>
            <Route path={AppRoute.HELPER} element={<HelperView />} />
            <Route
              path={AppRoute.PROGRAM}
              element={<Navigate replace to={ProgramTab.PROGRAM_LIST} />}
            />
            <Route
              path={ProgramTab.PROGRAM_LIST}
              element={<AllProgramItemsView />}
            />
            <Route
              path={`${AppRoute.PROGRAM_ITEM}/:programItemId`}
              element={<ProgramItemView />}
            />
            <Route path={AppRoute.PROFILE} element={<ProfileView />} />
          </>
        )}
        {!loggedIn && <Route path={AppRoute.LOGIN} element={<LoginView />} />}
        {!loggedIn && (
          <Route path={AppRoute.ADMIN_LOGIN} element={<LoginView />} />
        )}
        <Route path={AppRoute.LOGOUT} element={<LogoutView />} />
        <Route
          path={`${AppRoute.ABOUT}/*`}
          element={<Tabs tabContents={aboutTabs} />}
        />
        <Route path={AppRoute.ROOT} element={<div />} />
        <Route path={AppRoute.ANY} element={<Navigate to={AppRoute.ROOT} />} />
      </Routes>
    );
  }

  if (loggedIn) {
    if (kompassiId !== 0 && !kompassiUsernameAccepted) {
      return (
        <Routes>
          <Route path={AppRoute.LOGOUT} element={<LogoutView />} />
          <Route path={AppRoute.ANY} element={<KompassiLoginUsernameForm />} />
          <Route
            path={AppRoute.KOMPASSI_LOGOUT_CALLBACK}
            element={<KompassiLogoutCallback />}
          />
        </Routes>
      );
    }

    return (
      <Routes>
        {isAdminOrHelp(userGroup) ? (
          <Route
            path={ProgramTab.PROGRAM_LIST}
            element={<AllProgramItemsView />}
          />
        ) : (
          <Route
            path={`${AppRoute.PROGRAM}/*`}
            element={<Tabs tabContents={programTabs} />}
          />
        )}
        <Route
          path={`${AppRoute.PROGRAM_ITEM}/:programItemId`}
          element={<ProgramItemView />}
        />
        <Route path={AppRoute.NOTIFICATIONS} element={<EventLog />} />
        {!isAdminOrHelp(userGroup) && config.event().enableGroups ? (
          <Route
            path={`${AppRoute.PROFILE}/*`}
            element={<Tabs tabContents={profileTabs} />}
          />
        ) : (
          <Route path={AppRoute.PROFILE} element={<ProfileView />} />
        )}
        {isAdminOrHelp(userGroup) && (
          <Route path={AppRoute.PROFILE} element={<ProfileView />} />
        )}
        {isAdmin(userGroup) && (
          <Route path={AppRoute.ADMIN} element={<AdminView />} />
        )}
        <Route path={AppRoute.LOGOUT} element={<LogoutView />} />
        <Route
          path={AppRoute.KOMPASSI_LOGOUT_CALLBACK}
          element={<KompassiLogoutCallback />}
        />
        {/* Login path is required for after login redirect to work */}
        <Route path={AppRoute.LOGIN} element={<LoginView />} />
        <Route path={AppRoute.ADMIN_LOGIN} element={<LoginView />} />
        {isAdminOrHelp(userGroup) && (
          <Route path={AppRoute.HELPER} element={<HelperView />} />
        )}
        <Route
          path={`${AppRoute.ABOUT}/*`}
          element={<Tabs tabContents={aboutTabs} />}
        />
        {isAdminOrHelp(userGroup) ? (
          <Route
            path={AppRoute.ROOT}
            element={<Navigate to={ProgramTab.PROGRAM_LIST} />}
          />
        ) : (
          <Route
            path={AppRoute.ROOT}
            element={<Navigate to={ProgramTab.MY_PROGRAM} />}
          />
        )}
        <Route
          path={`${AppRoute.PROGRAM_ITEM}/:programItemId/admission`}
          element={<AdmissionTicketView />}
        />
        <Route path={AppRoute.ANY} element={<Navigate to={AppRoute.ROOT} />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path={AppRoute.LOGIN} element={<LoginView />} />
      <Route path={AppRoute.ADMIN_LOGIN} element={<LoginView />} />
      {loginProvider !== LoginProvider.KOMPASSI && (
        <Route path={AppRoute.REGISTRATION} element={<RegistrationView />} />
      )}
      <Route
        path={AppRoute.PROGRAM}
        element={<Navigate replace to={ProgramTab.PROGRAM_LIST} />}
      />
      <Route path={ProgramTab.PROGRAM_LIST} element={<AllProgramItemsView />} />
      <Route
        path={`${AppRoute.PROGRAM_ITEM}/:programItemId`}
        element={<ProgramItemView />}
      />
      <Route
        path={`${AppRoute.ABOUT}/*`}
        element={<Tabs tabContents={aboutTabs} />}
      />
      <Route
        path={AppRoute.ROOT}
        element={<Navigate to={AppRoute.PROGRAM} />}
      />
      <Route
        path={AuthEndpoint.KOMPASSI_LOGIN_CALLBACK}
        element={<KompassiLoginCallback />}
      />
      <Route path={AppRoute.ANY} element={<Navigate to={AppRoute.LOGIN} />} />
    </Routes>
  );
};

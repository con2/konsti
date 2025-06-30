import { ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router";
import { LocalLoginForm } from "client/views/login/components/LocalLoginForm";
import { useAppSelector } from "client/utils/hooks";
import { LoginProvider } from "shared/config/eventConfigTypes";
import { KompassiLogin } from "client/views/login/components/KompassiLogin";
import { navigateToPreviousOrRoot } from "client/utils/navigation";
import { usePreviousLocation } from "client/app/HistoryContext";
import { AppRoute } from "client/app/AppRoutes";
import { InfoText } from "client/components/InfoText";
import { KompassiAndLocalLogin } from "client/views/login/components/KompassiAndLocalLogin";

export const LoginView = (): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const prevLocation = usePreviousLocation();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const loginProvider = useAppSelector((state) => state.admin.loginProvider);
  const appOpen = useAppSelector((state) => state.admin.appOpen);

  const isAdminLogin = location.pathname === "/admin/login";

  useEffect(() => {
    if (loggedIn) {
      if (prevLocation?.pathname === "/program/list") {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        navigate(AppRoute.ROOT);
      }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      navigateToPreviousOrRoot(navigationType, navigate);
    }
  }, [loggedIn, navigate, navigationType, prevLocation]);

  return (
    <div>
      <h2>{t("pageTitle.login")}</h2>

      {(loginProvider === LoginProvider.LOCAL || isAdminLogin) && (
        <>
          <p>{t("loginView.oldAccountsNotWorking")}</p>
          <LocalLoginForm />
          <Link to={"/registration"}>
            <p>{t("loginView.noAccountRegister")}</p>
          </Link>
        </>
      )}

      {loginProvider === LoginProvider.KOMPASSI && (
        <>
          {appOpen && (
            <>
              <p>{t("loginView.kompassiLoginHint")}</p>
              <KompassiLogin />
            </>
          )}
          {!appOpen && (
            <>
              <InfoText>{t("loginView.notOpenYet")}</InfoText>
              <p>{t("loginView.createKompassiAccountHint")}</p>

              <Link to={"https://kompassi.eu/login"}>
                <p>{t("loginView.createKompassiAccount")}</p>
              </Link>
            </>
          )}
        </>
      )}

      {loginProvider === LoginProvider.LOCAL_KOMPASSI && (
        <>
          {appOpen && <KompassiAndLocalLogin />}
          {!appOpen && (
            <>
              <InfoText>{t("loginView.notOpenYet")}</InfoText>
              <p>{t("loginView.createKompassiAccountHint")}</p>

              <Link to={"https://kompassi.eu/login"}>
                <p>{t("loginView.createKompassiAccount")}</p>
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
};

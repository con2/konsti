import { ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router";
import { LoginProvider } from "shared/config/eventConfigTypes";
import { usePreviousLocation } from "client/app/historyContext";
import { AppRoute } from "client/app/routes";
import { InfoText } from "client/components/InfoText";
import { useAppSelector } from "client/utils/hooks";
import { navigateToPreviousOrRoot } from "client/utils/navigation";
import { KompassiAndLocalLogin } from "client/views/login/components/KompassiAndLocalLogin";
import { KompassiLoginButton } from "client/views/login/components/KompassiLoginButton";
import { LocalLoginForm } from "client/views/login/components/LocalLoginForm";

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
    if (!loggedIn) {
      return;
    }

    if (prevLocation?.pathname === "/program/list") {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      navigate(AppRoute.ROOT);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    navigateToPreviousOrRoot(navigationType, navigate);
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

      {loginProvider === LoginProvider.KOMPASSI && !isAdminLogin && (
        <>
          {appOpen && (
            <>
              <p>{t("loginView.kompassiLoginHint")}</p>
              <KompassiLoginButton />
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

      {loginProvider === LoginProvider.LOCAL_KOMPASSI && !isAdminLogin && (
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

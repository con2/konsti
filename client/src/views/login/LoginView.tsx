import { ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router";
import { LoginForm } from "client/views/login/components/LoginForm";
import { useAppSelector } from "client/utils/hooks";
import { LoginProvider } from "shared/config/eventConfigTypes";
import { KompassiLogin } from "client/views/login/components/KompassiLogin";
import { Button, ButtonStyle } from "client/components/Button";
import { navigateToPreviousOrRoot } from "client/utils/navigation";
import { usePreviousLocation } from "client/app/HistoryContext";
import { AppRoute } from "client/app/AppRoutes";

export const LoginView = (): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const prevLocation = usePreviousLocation();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const loginProvider = useAppSelector((state) => state.admin.loginProvider);
  const appOpen = useAppSelector((state) => state.admin.appOpen);

  const adminLogin = location.pathname === "/admin/login";

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

      {(loginProvider === LoginProvider.LOCAL || adminLogin) && (
        <>
          <p>{t("loginView.oldAccountsNotWorking")}</p>

          <LoginForm />

          <Link to={"/registration"}>
            <p>{t("loginView.noAccountRegister")}</p>
          </Link>
        </>
      )}

      {loginProvider === LoginProvider.KOMPASSI && !adminLogin && (
        <>
          {appOpen && <KompassiLogin />}
          {!appOpen && (
            <>
              <p>{t("loginView.createKompassiAccountHint")}</p>

              <Button
                buttonStyle={ButtonStyle.PRIMARY}
                onClick={() => {
                  window.open("https://kompassi.eu/login", "_blank");
                }}
              >
                {t("loginView.createKompassiAccount")}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
};

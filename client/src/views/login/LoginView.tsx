import { ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { LoginForm } from "client/views/login/components/LoginForm";
import { useAppSelector } from "client/utils/hooks";
import { LoginProvider } from "shared/config/sharedConfig.types";
import { KompassiLogin } from "client/views/login/components/KompassiLogin";

export const LoginView = (): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const loginProvider = useAppSelector((state) => state.admin.loginProvider);

  useEffect(() => {
    if (loggedIn) {
      navigate("/");
    }
  }, [loggedIn, navigate]);

  return (
    <div>
      <h2>{t("pageTitle.login")}</h2>
      <p>{t("loginView.oldAccountsNotWorking")}</p>

      {loginProvider === LoginProvider.LOCAL && <LoginForm />}

      {loginProvider === LoginProvider.KOMPASSI && <KompassiLogin />}

      <Link to={`/registration`}>
        <p>{t("loginView.noAccountRegister")}</p>
      </Link>
    </div>
  );
};

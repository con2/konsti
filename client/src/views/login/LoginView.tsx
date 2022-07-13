import React, { ReactElement, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { LoginForm } from "client/views/login/components/LoginForm";
import { useAppSelector } from "client/utils/hooks";

export const LoginView = (): ReactElement => {
  const { t } = useTranslation();
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    if (loggedIn) {
      navigate("/");
    }
  }, [loggedIn, navigate]);

  return (
    <div>
      <h2>{t("pageTitle.login")}</h2>
      <p>{t("loginView.oldAccountsNotWorking")}</p>
      <LoginForm />

      <Link to={`/registration`}>
        <p>{t("loginView.noAccountRegister")}</p>
      </Link>
    </div>
  );
};

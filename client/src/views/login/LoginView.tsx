import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { LoginForm } from "client/views/login/components/LoginForm";

export const LoginView = (): ReactElement => {
  const { t } = useTranslation();

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

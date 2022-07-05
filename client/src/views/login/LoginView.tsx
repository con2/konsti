import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { LoginForm } from "client/views/login/components/LoginForm";

export const LoginView = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{t("pageTitle.login")}</h2>
      <LoginForm />
    </div>
  );
};

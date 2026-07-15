import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export const LoginToSignupLink = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <p>
      <Link to={"/login"}>{t("signup.loginToSignup")}</Link>
    </p>
  );
};

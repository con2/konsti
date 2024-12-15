import { ReactElement } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { RegistrationForm } from "client/views/registration/components/RegistrationForm";

export const RegistrationView = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <>
      <h2>{t("pageTitle.registration")}</h2>
      <p>{t("loginView.oldAccountsNotWorking")}</p>
      <RegistrationForm />{" "}
      <Link to={`/login`}>
        <p>{t("registrationView.alreadyHaveAccountLogin")}</p>
      </Link>
    </>
  );
};

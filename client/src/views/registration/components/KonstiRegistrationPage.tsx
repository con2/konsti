import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { KonstiRegistrationForm } from "client/views/registration/components/KonstiRegistrationForm";

export const KonstiRegistrationPage = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <>
      <h2>{t("pageTitle.registration")}</h2>
      <KonstiRegistrationForm />
      <Link to={"/login"}>
        <p>{t("registrationView.alreadyHaveAccountLogin")}</p>
      </Link>
    </>
  );
};

import { ReactElement } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RegistrationForm } from "client/views/registration/components/RegistrationForm";

export const RegistrationView = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <>
      <RegistrationForm />{" "}
      <Link to={`/login`}>
        <p>{t("registrationView.alreadyHaveAccountLogin")}</p>
      </Link>
    </>
  );
};

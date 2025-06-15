import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { z } from "zod";
import { Button, ButtonStyle } from "client/components/Button";
import { postKompassiLoginRedirect } from "client/services/loginServices";
import { LoginErrorMessage } from "client/views/login/loginThunks";
import { ErrorMessage } from "client/components/ErrorMessage";

export const KompassiLogin = (): ReactElement => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [serverError, setServerError] = useState<LoginErrorMessage | null>(
    null,
  );

  useEffect(() => {
    const error = searchParams.get("error");
    const result = z.nativeEnum(LoginErrorMessage).safeParse(error);
    if (!result.success) {
      return;
    }
    if (error) {
      setServerError(result.data);
    }
  }, [searchParams]);

  return (
    <>
      <Link to={"https://kompassi.eu/login"}>
        <p>{t("registrationView.linkToLogin")}</p>
      </Link>
      {serverError && (
        <ErrorMessage
          message={t(serverError)}
          closeError={() => {
            setServerError(null);
            setSearchParams("");
          }}
        />
      )}
    </>
  );
};

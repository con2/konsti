import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { z } from "zod";
import { postKompassiLoginRedirect } from "client/services/loginServices";
import { LoginErrorMessage } from "client/views/login/loginThunks";
import { ErrorMessage } from "client/components/ErrorMessage";
import { Button, ButtonStyle } from "client/components/Button";

export const KompassiLoginButton = (): ReactElement => {
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
      <Button
        buttonStyle={ButtonStyle.PRIMARY}
        onClick={async () => {
          await postKompassiLoginRedirect();
        }}
      >
        {t("loginView.kompassiLogin")}
      </Button>
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

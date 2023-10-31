import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
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
    <div>
      <p>{t("loginView.kompassiLoginHint")}</p>

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
    </div>
  );
};

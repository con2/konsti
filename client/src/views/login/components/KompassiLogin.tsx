import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button, ButtonStyle } from "client/components/Button";
import { getKompassiLoginRedirectUrl } from "client/services/loginServices";
import { LoginErrorMessage } from "client/views/login/loginThunks";
import { ErrorMessage } from "client/components/ErrorMessage";
import { ButtonGroup } from "client/components/ButtonGroup";

export const KompassiLogin = (): ReactElement => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

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
      <ButtonGroup>
        <Button
          buttonStyle={ButtonStyle.PRIMARY}
          onClick={async () => {
            await getKompassiLoginRedirectUrl();
          }}
        >
          {t("loginView.kompassiLogin")}
        </Button>

        <Button
          buttonStyle={ButtonStyle.PRIMARY}
          onClick={() => {
            window.open("https://kompassi.eu/register", "_blank");
          }}
        >
          {t("loginView.createKompassiAccount")}
        </Button>
      </ButtonGroup>

      {serverError && (
        <ErrorMessage
          message={t(serverError)}
          closeError={() => setServerError(null)}
        />
      )}
    </div>
  );
};
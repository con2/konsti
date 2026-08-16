import { captureException } from "@sentry/react";
import { ReactElement, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { z } from "zod";
import { Button, ButtonStyle } from "client/components/Button";
import { ErrorMessage } from "client/components/ErrorMessage";
import { postKompassiLoginRedirect } from "client/services/loginServices";
import { LoginErrorMessage } from "client/views/login/loginThunks";

export const KompassiLoginButton = (): ReactElement => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [serverError, setServerError] = useState<LoginErrorMessage | null>(
    null,
  );

  // A second click would store a second state while the first request is still
  // in flight, and the page then leaves for whichever authorize URL resolves
  // last - which may carry the state that is no longer stored. A ref rather
  // than state on purpose: nothing renders from it, so a page restored from
  // the bfcache (Back from the Kompassi consent screen) can't come back stuck
  const redirecting = useRef(false);

  useEffect(() => {
    const error = searchParams.get("error");
    const result = z.enum(LoginErrorMessage).safeParse(error);
    if (!result.success) {
      return;
    }
    if (error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServerError(result.data);
    }
  }, [searchParams]);

  return (
    <>
      <Button
        buttonStyle={ButtonStyle.PRIMARY}
        onClick={async () => {
          if (redirecting.current) {
            return;
          }
          redirecting.current = true;
          try {
            await postKompassiLoginRedirect();
          } catch (error) {
            // The request wrapper reports its own failures, so getting here
            // means storage refused to keep the login state. Nothing else
            // would notice: the click just appears to do nothing
            captureException(error);
          }
          // Only reached when no redirect happened: the success path never
          // resolves, because the page is unloading. A `finally` would say
          // this better, but the React Compiler declines any function
          // containing one
          redirecting.current = false;
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

import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "./Button";
import { sharedConfig } from "shared/config/sharedConfig";
import { HighlightStyle, RaisedCard } from "client/components/RaisedCard";

export const FirstLogin = (): ReactElement | null => {
  const { t } = useTranslation();
  const serial = useAppSelector((state) => state.login.serial);
  const username = useAppSelector((state) => state.login.username);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);

  useEffect(() => {
    if (!username) {
      return;
    }

    const firstLoginKey = `${sharedConfig.CONVENTION_NAME}-${sharedConfig.CONVENTION_YEAR}-${username}`;
    const firstLogin = localStorage.getItem(firstLoginKey);

    if (firstLogin === null) {
      setIsFirstLogin(true);
      localStorage.setItem(firstLoginKey, "firstLogin");
    } else {
      setIsFirstLogin(false);
    }
  }, [username]);

  if (!isFirstLogin || !serial) {
    return null;
  }

  return (
    <RaisedCard isHighlighted={true} highlightStyle={HighlightStyle.WARN}>
      <p>
        {t("firstLogin.serial")} <b>{serial}</b>
      </p>
      <p>{t("firstLogin.info")}</p>
      <Button
        onClick={() => setIsFirstLogin(false)}
        buttonStyle={ButtonStyle.PRIMARY}
      >
        {t("button.close")}
      </Button>
    </RaisedCard>
  );
};

import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { z } from "zod";
import { useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "./Button";
import { config } from "shared/config";
import { HighlightStyle, RaisedCard } from "client/components/RaisedCard";
import { LoginProvider } from "shared/config/eventConfigTypes";

const firstLoginValue = "firstLogin";
const FirstLoginValueSchema = z.literal(firstLoginValue);

const getFirstLoginState = (key: string): typeof firstLoginValue | null => {
  const serializedValue = localStorage.getItem(key);

  const result = FirstLoginValueSchema.safeParse(serializedValue);
  if (!result.success) {
    return null;
  }

  return result.data;
};

export const FirstLogin = (): ReactElement | null => {
  const { t } = useTranslation();
  const serial = useAppSelector((state) => state.login.serial);
  const username = useAppSelector((state) => state.login.username);
  const loginProvider = useAppSelector((state) => state.admin.loginProvider);
  const isLocalLogin = loginProvider === LoginProvider.LOCAL;

  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);

  useEffect(() => {
    if (!username) {
      return;
    }

    const firstLoginKey = `${config.event().eventName}-${
      config.event().eventYear
    }-${username}`;
    const firstLogin = getFirstLoginState(firstLoginKey);

    if (firstLogin === null) {
      setIsFirstLogin(true);
      localStorage.setItem(firstLoginKey, firstLoginValue);
    } else {
      setIsFirstLogin(false);
    }
  }, [username]);

  if (!isFirstLogin || !serial || !isLocalLogin) {
    return null;
  }

  return (
    <StyledCard isHighlighted={true} highlightStyle={HighlightStyle.WARN}>
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
    </StyledCard>
  );
};

const StyledCard = styled(RaisedCard)`
  margin: 0 8px 0 8px;
`;

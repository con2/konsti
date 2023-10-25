import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "./Button";
import { getSharedConfig } from "shared/config/sharedConfig";
import { HighlightStyle, RaisedCard } from "client/components/RaisedCard";
import { LoginProvider } from "shared/config/sharedConfig";

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

    const firstLoginKey = `${getSharedConfig().CONVENTION_NAME}-${
      getSharedConfig().CONVENTION_YEAR
    }-${username}`;
    const firstLogin = localStorage.getItem(firstLoginKey);

    if (firstLogin === null) {
      setIsFirstLogin(true);
      localStorage.setItem(firstLoginKey, "firstLogin");
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

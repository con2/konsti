import React, { ReactElement, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "./Button";
import { sharedConfig } from "shared/config/sharedConfig";
import { MOBILE_MARGIN } from "client/globalStyle";

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
    <FirstLoginContainer>
      <p>
        {t("firstLogin.serial")} <b>{serial}</b>
      </p>
      <p>{t("firstLogin.info")}</p>
      <Button
        onClick={() => setIsFirstLogin(false)}
        buttonStyle={ButtonStyle.NORMAL}
      >
        {t("button.close")}
      </Button>
    </FirstLoginContainer>
  );
};

const FirstLoginContainer = styled.div`
  border: 1px solid ${(props) => props.theme.borderWarning};
  background: #fafafa;
  padding: 8px;
  margin: 0 0 10px 0;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: ${MOBILE_MARGIN}px;
    margin-right: ${MOBILE_MARGIN}px;
  }
`;

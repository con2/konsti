import React, { ReactElement, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { config } from "client/config";
import { useAppSelector } from "client/utils/hooks";
import { Button } from "./Button";

export const FirstLogin = (): ReactElement | null => {
  const { t } = useTranslation();
  const serial = useAppSelector((state) => state.login.serial);
  const username = useAppSelector((state) => state.login.username);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);

  useEffect(() => {
    if (!username) {
      return;
    }

    const firstLoginKey = `${config.CONVENTION_NAME}-${config.CONVENTION_YEAR}-${username}`;
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
      <Button onClick={() => setIsFirstLogin(false)}>Sulje</Button>
    </FirstLoginContainer>
  );
};

const FirstLoginContainer = styled.div`
  border: 1px solid ${(props) => props.theme.warning};
  background: #fafafa;
  padding: 8px;
`;

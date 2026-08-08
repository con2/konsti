import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { z } from "zod";
import { useAppSelector } from "client/utils/hooks";
import { isAdminOrHelper } from "client/utils/checkUserGroup";
import { DismissibleBanner } from "client/components/DismissibleBanner";
import { HighlightStyle } from "client/components/RaisedCard";
import { browserStoragePrefix } from "shared/constants/browserStorage";
import { formatSerial } from "shared/utils/formatSerial";

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
  const kompassiId = useAppSelector((state) => state.login.kompassiId);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const isLocalLogin = !kompassiId;

  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);

  useEffect(() => {
    if (!username) {
      return;
    }

    const firstLoginKey = `${browserStoragePrefix}-firstLogin-${username}`;
    const firstLogin = getFirstLoginState(firstLoginKey);

    if (firstLogin === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsFirstLogin(true);
      localStorage.setItem(firstLoginKey, firstLoginValue);
    } else {
      setIsFirstLogin(false);
    }
  }, [username]);

  if (!isFirstLogin || !serial || !isLocalLogin || isAdminOrHelper(userGroup)) {
    return null;
  }

  return (
    <Inset>
      <DismissibleBanner
        data-testid="first-login-notice"
        icon="circle-exclamation"
        highlightStyle={HighlightStyle.INFO}
        dismissAriaLabel={t("iconAltText.closeFirstLoginNotice")}
        onDismiss={() => {
          setIsFirstLogin(false);
        }}
      >
        <Message>
          <p>
            {t("firstLogin.serial")} <b>{formatSerial(serial)}</b>.
          </p>
          <p>{t("firstLogin.info")}</p>
        </Message>
      </DismissibleBanner>
    </Inset>
  );
};

// Same inset as the app-level bars below the header, so the notices that
// can show at the same time share their edges
const Inset = styled.div`
  margin: 0 2px;
`;

const Message = styled.div`
  flex: 1;
`;

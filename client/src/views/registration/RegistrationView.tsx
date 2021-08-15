import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { RegistrationForm } from "client/views/registration/components/RegistrationForm";

export const RegistrationView = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <div>
      <NotificationMessage>
        {t("pageTitle.usernamePublicWarning")}.{" "}
        {t("pageTitle.usernameDiscordInfo")}
        <p>
          <a href={"https://2021.ropecon.fi/etaropecon/ohjeet/"}>
            {t("discordHint")}
          </a>
        </p>
      </NotificationMessage>

      <RegistrationForm />
    </div>
  );
};

const NotificationMessage = styled.div`
  color: ${(props) => props.theme.warning};
  margin: 20px 0 0 0;
`;

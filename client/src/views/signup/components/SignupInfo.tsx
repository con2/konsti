import React, { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Accordion } from "client/components/Accordion";
import { timeFormatter } from "client/utils/timeFormatter";
import { Paragraph } from "client/components/Paragraph";

interface Props {
  signupTime: string;
}

export const SignupInfo = ({ signupTime }: Props): ReactElement => {
  const { t } = useTranslation();

  const signupStartTime = timeFormatter.getStartTime(signupTime);
  const signupEndTime = timeFormatter.getEndTime(signupTime);

  return (
    <SignupInfoContainer>
      <p>
        {t("signupOpenBetweenCapital")} {signupStartTime}-{signupEndTime}.{" "}
        {t("signupResultHint")} {signupEndTime}.
      </p>
      <Accordion toggleButton={t("signupGuideButton")}>
        <h3>{t(`signupGuideTitle`)}</h3>
        <Paragraph text={t("signupGuide")} />
      </Accordion>
    </SignupInfoContainer>
  );
};

const SignupInfoContainer = styled.div`
  margin: 0 0 20px 0;
`;

import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Accordion } from 'client/components/Accordion';
import { timeFormatter } from 'client/utils/timeFormatter';

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
        {t('signupOpenBetweenCapital')} {signupStartTime}-{signupEndTime}.{' '}
        {t('signupResultHint')} {signupEndTime}.
      </p>
      <Accordion
        text='signupGuide'
        title='signupGuideTitle'
        buttonText='signupGuideButton'
      />
    </SignupInfoContainer>
  );
};

const SignupInfoContainer = styled.div`
  margin: 0 0 20px 0;
`;

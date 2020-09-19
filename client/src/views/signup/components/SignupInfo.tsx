import React, { FC, ReactElement } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Accordion } from 'components/Accordion';
import { timeFormatter } from 'utils/timeFormatter';

interface Props {
  signupTime: string;
}

export const SignupInfo: FC<Props> = (props: Props): ReactElement => {
  const { signupTime } = props;

  const { t } = useTranslation();

  const signupStartTime = timeFormatter.startTime(signupTime);
  const signupEndTime = timeFormatter.endTime(signupTime);

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

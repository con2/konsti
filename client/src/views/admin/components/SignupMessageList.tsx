import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SignupMessage } from 'shared/typings/models/settings';

export interface Props {
  signupMessages: readonly SignupMessage[];
}

export const SignupMessageList = ({ signupMessages }: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <div>
      <h3>{t('signupMessages')}</h3>

      <ul>
        {signupMessages.length === 0 && <span>{t('noSignupMessages')}</span>}

        {signupMessages.map((signupMessage) => (
          <li key={signupMessage.gameId}>
            <Link to={`/games/${signupMessage.gameId}`}>
              {signupMessage.gameId}: {signupMessage.message}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

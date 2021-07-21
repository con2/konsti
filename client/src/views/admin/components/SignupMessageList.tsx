import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Game } from 'shared/typings/models/game';
import { SignupMessage } from 'shared/typings/models/settings';
import { timeFormatter } from 'client/utils/timeFormatter';

export interface Props {
  signupMessages: readonly SignupMessage[];
  games: readonly Game[];
}

export const SignupMessageList = ({
  signupMessages,
  games,
}: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <div>
      <h3>{t('signupMessages')}</h3>

      <ul>
        {signupMessages.length === 0 && <span>{t('noSignupMessages')}</span>}

        {signupMessages.flatMap((signupMessage) => {
          const signedGame = games.find(
            (game) => game.gameId === signupMessage.gameId
          );
          if (!signedGame) return [];

          return (
            <li key={signupMessage.gameId}>
              <Link to={`/games/${signupMessage.gameId}`}>
                {signedGame.title}
              </Link>
              : {signupMessage.message} -{' '}
              {timeFormatter.getWeekdayAndTime({
                time: signedGame.startTime,
                capitalize: false,
              })}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

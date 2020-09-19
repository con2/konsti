import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import styled from 'styled-components';
import { ResultsByStartTimes } from './ResultsByStartTimes';
import { Signup } from 'typings/user.typings';
import { getMissedSignups } from '../utils/getMissedSignups';

export interface Props {
  enteredGames: readonly Signup[];
  signedGames: readonly Signup[];
}

export const MyEnteredList: FC<Props> = (props: Props): ReactElement => {
  const { enteredGames, signedGames } = props;
  const { t } = useTranslation();

  const [missedSignups, setMissedSignups] = React.useState<string[]>([]);
  const [startTimes, setStartTimes] = React.useState<string[]>([]);

  React.useEffect(() => {
    setMissedSignups(getMissedSignups(signedGames, enteredGames));
  }, [signedGames, enteredGames]);

  React.useEffect(() => {
    setStartTimes(
      enteredGames
        .map((sortedEnteredGame) => {
          return sortedEnteredGame.time;
        })
        .concat(missedSignups)
    );
  }, [missedSignups]);

  return (
    <div className='my-entered-list'>
      <h3>{t('enteredGames')}</h3>
      <MyEnteredGames>
        {startTimes.length === 0 && <span>{t('noEnteredGames')}</span>}
        {startTimes.length !== 0 && (
          <ResultsByStartTimes
            signups={_.sortBy(enteredGames, [
              (enteredGame) => enteredGame.time,
            ])}
            startTimes={[...Array.from(new Set(startTimes))].sort()}
            missedSignups={missedSignups}
          />
        )}
      </MyEnteredGames>
    </div>
  );
};

const MyEnteredGames = styled.div`
  padding-left: 30px;
`;

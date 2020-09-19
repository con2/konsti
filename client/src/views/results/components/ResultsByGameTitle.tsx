import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import styled from 'styled-components';

import { Result } from 'typings/result.typings';

export interface Props {
  results: readonly Result[];
}

export const ResultsByGameTitle: FC<Props> = (props: Props): ReactElement => {
  const { results } = props;
  const { t } = useTranslation();

  const sortedResults = _.sortBy(results, [
    (result) => result.enteredGame.gameDetails.title.toLowerCase(),
  ]);

  const groupedResults = _.groupBy(
    sortedResults,
    'enteredGame.gameDetails.title'
  );

  const resultsByGameTitle: ReactElement[] = [];

  for (const result in groupedResults) {
    const sortedResults = _.sortBy(groupedResults[result], [
      (result) => result.username.toLowerCase(),
    ]);

    const playerList = sortedResults.map((result) => (
      <p key={result.username}>{result.username}</p>
    ));

    resultsByGameTitle.push(
      <GameResult key={result}>
        <p>
          <span className='bold'>{t('gameTitle')}:</span> {result}
        </p>
        <p>
          <span className='bold'>{t('gameInfo.location')}:</span>{' '}
          {_.head(groupedResults[result])?.enteredGame.gameDetails.location}
        </p>
        <p className='bold'>{t('players')}:</p>
        <ResultPlayerList>{playerList}</ResultPlayerList>
      </GameResult>
    );
  }

  return <div className='results-by-gametime'>{resultsByGameTitle}</div>;
};

const GameResult = styled.div`
  border-bottom: solid 1px ${(props) => props.theme.disabled};
  padding-bottom: 10px;
`;

const ResultPlayerList = styled.div`
  padding-left: 30px;
`;

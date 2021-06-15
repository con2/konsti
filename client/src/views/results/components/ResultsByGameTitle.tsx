import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import styled from 'styled-components';
import { Result } from 'shared/typings/models/result';

export interface Props {
  results: readonly Result[];
}

export const ResultsByGameTitle = ({ results }: Props): ReactElement => {
  const { t } = useTranslation();

  const sortedResults = _.sortBy(results, [
    (result) => result.enteredGame.gameDetails.title.toLowerCase(),
  ]);

  const groupedResults = _.groupBy(
    sortedResults,
    'enteredGame.gameDetails.title'
  );

  const resultsByGameTitle: ReactElement[] = [];

  for (const groupedResult in groupedResults) {
    const reSortedResults = _.sortBy(groupedResults[groupedResult], [
      (result) => result.username.toLowerCase(),
    ]);

    const playerList = reSortedResults.map((result) => (
      <p key={result.username}>{result.username}</p>
    ));

    resultsByGameTitle.push(
      <GameResult key={groupedResult}>
        <p>
          <span className='bold'>{t('gameTitle')}:</span> {groupedResult}
        </p>
        <p>
          <span className='bold'>{t('gameInfo.location')}:</span>{' '}
          {
            _.head(groupedResults[groupedResult])?.enteredGame.gameDetails
              .location
          }
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

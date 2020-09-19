import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import styled from 'styled-components';
import { Result } from 'typings/result.typings';

export interface Props {
  results: readonly Result[];
}

export const ResultsByUsername: FC<Props> = (props: Props): ReactElement => {
  const { results } = props;
  const { t } = useTranslation();

  const sortedResults = _.sortBy(results, [
    (result) => result.username.toLowerCase(),
  ]);

  const resultsTable = sortedResults.map((result) => (
    <FlexTableColumn key={result.username}>
      <FlexTableRow>{result.username}</FlexTableRow>
      <FlexTableRow>{result.enteredGame.gameDetails.title}</FlexTableRow>
      <FlexTableRow>{result.enteredGame.gameDetails.location}</FlexTableRow>
    </FlexTableColumn>
  ));

  const resultsByUsername = (
    <FlexTableContainer>
      <FlexTableColumn className='flex-table-header'>
        <FlexTableRow>{t('player')}</FlexTableRow>
        <FlexTableRow>{t('gameTitle')}</FlexTableRow>
        <FlexTableRow>{t('gameInfo.location')}</FlexTableRow>
      </FlexTableColumn>
      {resultsTable}
    </FlexTableContainer>
  );

  return resultsByUsername;
};

const FlexTableContainer = styled.div`
  margin-top: 10px;
`;

const FlexTableColumn = styled.div`
  border-bottom: solid 1px ${(props) => props.theme.disabled};
  display: flex;
  flex-direction: row;
  padding: 10px 0;

  &.flex-table-header {
    font-weight: 700;
    padding-bottom: 20px;
  }
`;

const FlexTableRow = styled.div`
  width: 33%;
  word-break: break-word;
  padding: 0 20px 0 0;
`;

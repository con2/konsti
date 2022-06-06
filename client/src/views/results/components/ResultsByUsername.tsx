import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import styled, { css } from "styled-components";
import { Result } from "shared/typings/models/result";

interface Props {
  results: readonly Result[];
}

export const ResultsByUsername = ({ results }: Props): ReactElement => {
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
      <FlexTableColumn header={true}>
        <FlexTableRow>{t("player")}</FlexTableRow>
        <FlexTableRow>{t("gameTitle")}</FlexTableRow>
        <FlexTableRow>{t("gameInfo.location")}</FlexTableRow>
      </FlexTableColumn>
      {resultsTable}
    </FlexTableContainer>
  );

  return resultsByUsername;
};

const FlexTableContainer = styled.div`
  margin-top: 10px;
`;

interface FlexTableColumnProps {
  header?: boolean;
}

const FlexTableColumn = styled.div<FlexTableColumnProps>`
  border-bottom: solid 1px ${(props) => props.theme.borderDisabled};
  display: flex;
  flex-direction: row;
  padding: 10px 0;

  ${(flexTableColumnProps) =>
    flexTableColumnProps.header &&
    css`
      font-weight: 700;
      padding-bottom: 20px;
    `};
`;

const FlexTableRow = styled.div`
  width: 33%;
  word-break: break-word;
  padding: 0 20px 0 0;
`;

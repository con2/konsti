import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import styled from "styled-components";
import { timeFormatter } from "client/utils/timeFormatter";
import { useAppSelector } from "client/utils/hooks";

export const HelperResultsList = (): ReactElement => {
  const results = useAppSelector((state) => state.results.result);
  const startTime = useAppSelector((state) => state.results.startTime);
  const { t } = useTranslation();

  const validResults = results.filter(
    (result) => result.enteredGame.gameDetails
  );

  const sortedResults = _.sortBy(validResults, [
    (result) => result.enteredGame.gameDetails.title.toLowerCase(),
  ]);

  const groupedResults = _.groupBy(
    sortedResults,
    "enteredGame.gameDetails.title"
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
          <InfoText>{t("gameTitle")}:</InfoText> {groupedResult}
        </p>
        <p>
          <InfoText>{t("gameInfo.location")}:</InfoText>{" "}
          {
            _.head(groupedResults[groupedResult])?.enteredGame.gameDetails
              .location
          }
        </p>
        <p>
          <InfoText>{t("players")}: </InfoText>
          {playerList.length}/
          {
            _.head(groupedResults[groupedResult])?.enteredGame.gameDetails
              .maxAttendance
          }
        </p>
      </GameResult>
    );
  }

  return (
    <div className="results-with-free-seats">
      <h3>
        {t("signupResults")}:{" "}
        {startTime ? (
          <span>
            {timeFormatter.getWeekdayAndTime({
              time: startTime,
              capitalize: false,
            })}
          </span>
        ) : (
          <span>{t("noResults")}</span>
        )}
      </h3>
      {resultsByGameTitle}
    </div>
  );
};

const GameResult = styled.div`
  border-bottom: solid 1px ${(props) => props.theme.disabled};
  padding-bottom: 10px;
`;

const InfoText = styled.span`
  font-weight: 600;
`;

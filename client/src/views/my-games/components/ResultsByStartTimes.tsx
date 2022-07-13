import React, { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { timeFormatter } from "client/utils/timeFormatter";
import { SelectedGame } from "shared/typings/models/user";
import { EnteredGameRow } from "client/views/my-games/components/EnteredGameRow";

interface Props {
  signups: readonly SelectedGame[];
  startTimes: readonly string[];
  missedSignups: readonly string[];
}

export const ResultsByStartTimes = ({
  signups,
  startTimes,
  missedSignups,
}: Props): ReactElement => {
  const { t } = useTranslation();

  return (
    <>
      {startTimes.map((startTime) => {
        return (
          <div key={startTime}>
            <StyledTime>
              {timeFormatter.getWeekdayAndTime({
                time: startTime,
                capitalize: true,
              })}
            </StyledTime>

            {signups.map((signup) => {
              return (
                <EnteredGameRow
                  key={signup.gameDetails.gameId}
                  signup={signup}
                  startTime={startTime}
                />
              );
            })}

            {missedSignups.map((missedSignup) => {
              if (missedSignup === startTime) {
                return (
                  <GameDetailsList key={missedSignup}>
                    {t("noLotterySignupResult")}
                  </GameDetailsList>
                );
              }
            })}
          </div>
        );
      })}
    </>
  );
};

const GameDetailsList = styled.div`
  display: flex;
  align-items: center;
  padding-left: 30px;
`;

const StyledTime = styled.p`
  font-weight: 600;
  margin: 10px 0;
`;

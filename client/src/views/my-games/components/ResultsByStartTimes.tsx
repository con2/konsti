import { ReactElement } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { capitalize } from "lodash-es";
import { getWeekdayAndTime } from "client/utils/timeFormatter";
import { SelectedGame } from "shared/types/models/user";
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
            <StyledTime>{capitalize(getWeekdayAndTime(startTime))}</StyledTime>

            <ul>
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
            </ul>
          </div>
        );
      })}
    </>
  );
};

const GameDetailsList = styled.div`
  display: flex;
  align-items: center;
`;

const StyledTime = styled.p`
  font-weight: 600;
  margin: 10px 0;
`;

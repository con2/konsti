import { ReactElement, useRef } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { capitalize } from "lodash-es";
import { getTime, getWeekdayAndTime } from "client/utils/timeFormatter";
import { SelectedGame } from "shared/types/models/user";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { MOBILE_MARGIN } from "client/globalStyle";
import { config } from "shared/config";
import {
  getAlgorithmSignupEndTime,
  getAlgorithmSignupStartTime,
} from "shared/utils/signupTimes";

interface Props {
  startTime: string;
  signedGames: readonly SelectedGame[];
  enteredGames: readonly SelectedGame[];
  timeslotSignupStrategy: SignupStrategy;
  isGroupCreator: boolean;
  groupCode: string;
}

export const GameListTitle = ({
  startTime,
  signedGames,
  enteredGames,
  timeslotSignupStrategy,
  isGroupCreator,
  groupCode,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const intersectionRef = useRef<HTMLDivElement | null>(null);

  const formattedStartTime = capitalize(getWeekdayAndTime(startTime));

  const algorithmSignupStartTime = getTime(
    getAlgorithmSignupStartTime(startTime).toISOString(),
  );
  const algorithmSignupEndTime = getTime(
    getAlgorithmSignupEndTime(startTime).toISOString(),
  );

  const signedGamesCount = signedGames.filter(
    (game) => game.gameDetails.startTime === startTime,
  ).length;
  const signedGame = enteredGames.find(
    (game) => game.gameDetails.startTime === startTime,
  );

  return (
    <GameListTitleContainer key={startTime} ref={intersectionRef}>
      <StyledGameListTitle>
        <StartTimeContainer>
          <StartTime>{formattedStartTime}</StartTime>
          {timeslotSignupStrategy === SignupStrategy.ALGORITHM && (
            <SignupCount>{signedGamesCount} / 3</SignupCount>
          )}
        </StartTimeContainer>

        {config.shared().manualSignupMode === "none" &&
          timeslotSignupStrategy === SignupStrategy.ALGORITHM && (
            <span>
              ({t("lotterySignupOpenBetween")} {algorithmSignupStartTime}-
              {algorithmSignupEndTime})
            </span>
          )}

        {timeslotSignupStrategy === SignupStrategy.DIRECT && (
          <SignupCount>
            {signedGame ? signedGame.gameDetails.title : ""}
          </SignupCount>
        )}
      </StyledGameListTitle>

      {timeslotSignupStrategy === SignupStrategy.ALGORITHM &&
        groupCode !== "0" && (
          <GroupInfo>
            {isGroupCreator ? (
              <InfoText>{t("group.signupForWholeGroup")}</InfoText>
            ) : (
              <InfoText>{t("group.signupDisabledNotCreator")}</InfoText>
            )}
          </GroupInfo>
        )}
    </GameListTitleContainer>
  );
};

const StartTimeContainer = styled.span`
  display: flex;
  justify-content: space-between;
`;

const SignupCount = styled.span`
  float: right;
`;

const GameListTitleContainer = styled.div`
  z-index: 2;
  margin: 20px 0 20px 0;
  padding: 8px;
  background: #fafafa;
  color: rgb(61, 61, 61);
  border-radius: 4px;
  position: sticky;
  top: 0;

  box-shadow: ${(props) => props.theme.shadowHigher};

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: -${MOBILE_MARGIN}px;
    margin-right: -${MOBILE_MARGIN}px;
    border-radius: 0;
  }

  @media (max-width: ${(props) => props.theme.breakpointDesktop}) {
    margin-left: -${MOBILE_MARGIN}px;
    margin-right: -${MOBILE_MARGIN}px;
  }
`;

const StyledGameListTitle = styled.h3`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
`;

const GroupInfo = styled.p`
  margin: 0;
  padding: 10px 0 0 0;
`;

const InfoText = styled.span`
  font-weight: 600;
`;

const StartTime = styled.span`
  padding-right: 6px;
`;

import { ReactElement, useRef } from "react";
import styled, { css } from "styled-components";
import { useTranslation } from "react-i18next";
import useIntersectionObserver from "@react-hook/intersection-observer";
import { timeFormatter } from "client/utils/timeFormatter";
import { SelectedGame } from "shared/typings/models/user";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { MOBILE_MARGIN } from "client/globalStyle";
import { sharedConfig } from "shared/config/sharedConfig";

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
  const { isIntersecting } = useIntersectionObserver(intersectionRef);

  const formattedStartTime = timeFormatter.getWeekdayAndTime({
    time: startTime,
    capitalize: true,
  });
  const signupStartTime = timeFormatter.getStartTime(startTime);
  const signupEndTime = timeFormatter.getEndTime(startTime);

  const signedGamesCount = signedGames.filter(
    (game) => game.gameDetails.startTime === startTime
  ).length;
  const signedGame = enteredGames.find(
    (game) => game.gameDetails.startTime === startTime
  );

  return (
    <GameListTitleContainer
      key={startTime}
      ref={intersectionRef}
      isVisible={!!isIntersecting}
    >
      <StyledGameListTitle>
        <StartTimeContainer>
          <StartTime>{formattedStartTime}</StartTime>
          {timeslotSignupStrategy === SignupStrategy.ALGORITHM && (
            <SignupCount>{signedGamesCount} / 3</SignupCount>
          )}
        </StartTimeContainer>

        {sharedConfig.manualSignupMode === "none" &&
          timeslotSignupStrategy === SignupStrategy.ALGORITHM && (
            <span>
              ({t("lotterySignupOpenBetween")} {signupStartTime}-{signupEndTime}
              )
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

const GameListTitleContainer = styled.div<{ isVisible: boolean }>`
  z-index: 2;
  margin: 20px 0 20px 0;
  padding: 8px;
  background: #fafafa;
  border-bottom: 1px solid #d5d5d5;
  color: #3d3d3d;
  position: sticky;
  top: 0;

  ${(titleProps) =>
    titleProps.isVisible &&
    css`
      box-shadow: 4px 4px 45px 4px #d5d5d5;
    `};

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    margin-left: -${MOBILE_MARGIN}px;
    margin-right: -${MOBILE_MARGIN}px;
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

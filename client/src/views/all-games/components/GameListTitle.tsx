import React, { ReactElement, useRef } from "react";
import styled, { css } from "styled-components";
import { useTranslation } from "react-i18next";
import useIntersectionObserver from "@react-hook/intersection-observer";
import { timeFormatter } from "client/utils/timeFormatter";
import { Game } from "shared/typings/models/game";
import { SelectedGame } from "shared/typings/models/user";
import { SignupStrategy } from "shared/config/sharedConfig.types";

interface Props {
  startTime: string;
  gamesForStartTime: readonly Game[];
  signedGames: readonly SelectedGame[];
  enteredGames: readonly SelectedGame[];
  timeslotSignupStrategy: SignupStrategy;
  isGroupCreator: boolean;
  groupCode: string;
}

export const GameListTitle = ({
  startTime,
  gamesForStartTime,
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
        <StartTime>{formattedStartTime}</StartTime>

        {timeslotSignupStrategy === SignupStrategy.ALGORITHM && (
          <span>
            ({t("preSignupOpenBetween")} {signupStartTime}-{signupEndTime})
          </span>
        )}

        {timeslotSignupStrategy === SignupStrategy.DIRECT ? (
          <SignupCount>
            {signedGame ? signedGame.gameDetails.title : ""}
          </SignupCount>
        ) : (
          <SignupCount>{signedGamesCount} / 3</SignupCount>
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

const SignupCount = styled.span`
  float: right;
`;

const GameListTitleContainer = styled.div<{ isVisible: boolean }>`
  z-index: 2;
  margin: 20px 0;
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
`;

const StyledGameListTitle = styled.h3`
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

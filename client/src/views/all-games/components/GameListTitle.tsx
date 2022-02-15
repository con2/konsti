import React, { ReactElement, useRef } from "react";
import styled, { css } from "styled-components";
import { useTranslation } from "react-i18next";
import useIntersectionObserver from "@react-hook/intersection-observer";
import { timeFormatter } from "client/utils/timeFormatter";
import { Game } from "shared/typings/models/game";
import { SelectedGame } from "shared/typings/models/user";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { useAppSelector } from "client/utils/hooks";

interface Props {
  startTime: string;
  gamesForStartTime: readonly Game[];
  signedGames: readonly SelectedGame[];
  enteredGames: readonly SelectedGame[];
}

const getSignupStrategy = (
  gamesForStartTime: readonly Game[],
  signupStrategy: SignupStrategy | undefined
): SignupStrategy => {
  if (!signupStrategy) {
    throw new Error("No signup strategy found!");
  }

  if (signupStrategy === SignupStrategy.DIRECT_ALGORITHM) {
    return gamesForStartTime[0].signupStrategy;
  }
  return signupStrategy;
};

export const GameListTitle = ({
  startTime,
  gamesForStartTime,
  signedGames,
  enteredGames,
}: Props): ReactElement => {
  const { t } = useTranslation();

  const signupStrategy = useAppSelector((state) => state.admin.signupStrategy);
  const signupStrategyForBlock = getSignupStrategy(
    gamesForStartTime,
    signupStrategy
  );

  const intersectionRef = useRef<HTMLDivElement | null>(null);
  const { isIntersecting } = useIntersectionObserver(intersectionRef);

  const formattedStartTime = timeFormatter.getWeekdayAndTime({
    time: startTime,
    capitalize: true,
  });
  const signupStartTime = timeFormatter.getStartTime(startTime);
  const signupEndTime = timeFormatter.getEndTime(startTime);

  const allGamesRevolvingDoor = gamesForStartTime.every(
    (game) => game?.revolvingDoor
  );
  const signedGamesCount = signedGames.filter(
    (game) => game.gameDetails.startTime === startTime
  ).length;
  const signedGame = enteredGames.find(
    (game) => game.gameDetails.startTime === startTime
  );

  return (
    <StyledGameListTitle
      key={startTime}
      ref={intersectionRef}
      isVisible={!!isIntersecting}
    >
      <span>{formattedStartTime}</span>

      {!allGamesRevolvingDoor &&
        signupStrategyForBlock === SignupStrategy.ALGORITHM && (
          <span>
            {" "}
            ({t("signupOpenBetween")} {signupStartTime}-{signupEndTime})
          </span>
        )}

      {signupStrategyForBlock === SignupStrategy.DIRECT ? (
        <SignupCount>
          {signedGame ? signedGame.gameDetails.title : ""}
        </SignupCount>
      ) : (
        <SignupCount>{signedGamesCount} / 3</SignupCount>
      )}
    </StyledGameListTitle>
  );
};

const SignupCount = styled.span`
  float: right;
`;

interface StyledGameListTitleProps {
  isVisible: boolean;
}

const StyledGameListTitle = styled.h3<StyledGameListTitleProps>`
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

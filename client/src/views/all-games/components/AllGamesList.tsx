import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import { GameEntry } from "./GameEntry";
import { useAppSelector } from "client/utils/hooks";
import { Game } from "shared/typings/models/game";
import { GameListTitle } from "client/views/all-games/components/GameListTitle";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { getIsGroupCreator } from "client/views/group/utils/getIsGroupCreator";
import { getSignedGames } from "client/utils/getUpcomingGames";

export interface Props {
  games: readonly Game[];
}

export const AllGamesList = ({ games }: Props): ReactElement => {
  const { t } = useTranslation();

  const signups = useAppSelector((state) => state.allGames.signups);
  const ownSignedGames = useAppSelector((state) => state.myGames.signedGames);
  const enteredGames = useAppSelector((state) => state.myGames.enteredGames);
  const serial = useAppSelector((state) => state.login.serial);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  const ownOrGroupCreatorSignedGames = getSignedGames(
    ownSignedGames,
    groupCode,
    serial,
    groupMembers,
    true
  );

  const sortedGames = _.sortBy(games, [
    (game) => game.startTime,
    (game) => game.title.toLowerCase(),
  ]);

  const gamesByStartTime = _.groupBy(sortedGames, "startTime");

  const gamesList = Object.entries(gamesByStartTime).map(
    ([startTime, gamesForStartTime]) => {
      // TODO:  How should we handle case where not all the games inside timeslot have same signup strategy?
      //        Should not be problem in real cases, but is it ok to fallback ALGORITHM if data is broken?
      const timeslotSignupStrategy = gamesForStartTime.every(
        (game) => game.signupStrategy === SignupStrategy.DIRECT
      )
        ? SignupStrategy.DIRECT
        : SignupStrategy.ALGORITHM;

      return (
        <div key={startTime}>
          <GameListTitle
            startTime={startTime}
            gamesForStartTime={gamesForStartTime}
            signedGames={ownOrGroupCreatorSignedGames}
            enteredGames={enteredGames}
            timeslotSignupStrategy={timeslotSignupStrategy}
            isGroupCreator={isGroupCreator}
            groupCode={groupCode}
          />

          {gamesForStartTime.map((game) => {
            const gameSignups = signups.find(
              (gameSignup) => gameSignup.gameId === game.gameId
            );

            return (
              <GameEntry
                key={game.gameId}
                game={game}
                players={gameSignups?.users.length ?? 0}
                startTime={startTime}
                signupStrategy={timeslotSignupStrategy}
                signedGames={ownOrGroupCreatorSignedGames}
              />
            );
          })}
        </div>
      );
    }
  );

  return (
    <div>
      {games.length === 0 && <h3>{t("noProgramItemsAvailable")}</h3>}
      {games.length !== 0 && gamesList}
    </div>
  );
};

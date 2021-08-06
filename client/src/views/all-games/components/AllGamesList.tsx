import React, { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import { GameEntry } from "./GameEntry";
import { useAppSelector } from "client/utils/hooks";
import { Game } from "shared/typings/models/game";
import { GameListTitle } from "client/views/all-games/components/GameListTitle";

export interface Props {
  games: readonly Game[];
}

export const AllGamesList = ({ games }: Props): ReactElement => {
  const { t } = useTranslation();

  const signups = useAppSelector((state) => state.allGames.signups);
  const signedGames = useAppSelector((state) => state.myGames.signedGames);
  const enteredGames = useAppSelector((state) => state.myGames.enteredGames);

  const sortedGames = _.sortBy(games, [
    (game) => game.startTime,
    (game) => game.title.toLowerCase(),
  ]);

  const gamesByStartTime = _.groupBy(sortedGames, "startTime");

  const gamesList = Object.entries(gamesByStartTime).map(
    ([startTime, gamesForStartTime]) => {
      return (
        <div key={startTime}>
          <GameListTitle
            startTime={startTime}
            gamesForStartTime={gamesForStartTime}
            signedGames={signedGames}
            enteredGames={enteredGames}
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

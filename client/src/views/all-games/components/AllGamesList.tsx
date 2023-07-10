import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import { GameEntry } from "./GameEntry";
import { useAppSelector } from "client/utils/hooks";
import { Game } from "shared/typings/models/game";
import { GameListTitle } from "client/views/all-games/components/GameListTitle";
import { getIsGroupCreator } from "client/views/group/groupUtils";
import { getSignedGames } from "client/utils/getUpcomingGames";
import { getTimeslotSignupStrategy } from "client/views/all-games/allGamesUtils";
import {
  selectActiveEnteredGames,
  selectActiveSignedGames,
} from "client/views/my-games/myGamesSlice";

interface Props {
  games: readonly Game[];
}

export const AllGamesList = ({ games }: Props): ReactElement => {
  const { t } = useTranslation();

  const signups = useAppSelector((state) => state.allGames.signups);
  const activeSignedGames = useAppSelector(selectActiveSignedGames);
  const activeEnteredGames = useAppSelector(selectActiveEnteredGames);
  const serial = useAppSelector((state) => state.login.serial);
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
  );
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const isGroupCreator = getIsGroupCreator(groupCode, serial);

  const ownOrGroupCreatorSignedGames = getSignedGames({
    signedGames: activeSignedGames,
    groupCode,
    serial,
    groupMembers,
    getAllGames: true,
  });

  const sortedGames = _.sortBy(games, [
    (game) => game.startTime,
    (game) => game.title.toLowerCase(),
  ]);

  const gamesByStartTime = _.groupBy(sortedGames, "startTime");

  const gamesList = Object.entries(gamesByStartTime).map(
    ([startTime, gamesForStartTime]) => {
      const timeslotSignupStrategy = getTimeslotSignupStrategy(
        gamesForStartTime,
        activeProgramType,
        startTime
      );

      return (
        <div key={startTime}>
          <GameListTitle
            startTime={startTime}
            signedGames={ownOrGroupCreatorSignedGames}
            enteredGames={activeEnteredGames}
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
                isAlwaysExpanded={false}
                game={game}
                players={gameSignups?.users.length ?? 0}
                startTime={startTime}
                signupStrategy={timeslotSignupStrategy}
                signedGames={ownOrGroupCreatorSignedGames}
                enteredGames={activeEnteredGames}
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

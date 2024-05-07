import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Loading } from "client/components/Loading";
import { useAppSelector } from "client/utils/hooks";
import { GameEntry } from "client/views/all-games/components/GameEntry";
import {
  selectEnteredGames,
  selectFavoritedGames,
  selectSignedGames,
} from "client/views/my-games/myGamesSlice";
import { SignupStrategy } from "shared/config/sharedConfigTypes";
import { getSignedGames } from "client/utils/getUpcomingGames";
import { BackButton } from "client/components/BackButton";
import { getIsInGroup } from "client/views/group/groupUtils";

export const GameDetailsPage = (): ReactElement => {
  const { t } = useTranslation();

  const { gameId } = useParams();

  const games = useAppSelector((state) => state.allGames.games);
  const signups = useAppSelector((state) => state.allGames.signups);
  const enteredGames = useAppSelector(selectEnteredGames);
  const username = useAppSelector((state) => state.login.username);
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);
  const favoritedGames = useAppSelector(selectFavoritedGames);

  // Figure out if user has signed up to this game
  const signedGames = useAppSelector(selectSignedGames);
  const isGroupCreator = useAppSelector((state) => state.group.isGroupCreator);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const isInGroup = getIsInGroup(groupCode);

  const ownOrGroupCreatorSignedGames = getSignedGames({
    signedGames,
    isGroupCreator,
    groupMembers,
    isInGroup,
    getAllGames: true,
  });

  const [loading, setLoading] = useState<boolean>(true);

  const foundGame = games.find((game) => game.gameId === gameId);
  const playerCount =
    signups.find((gameSignup) => gameSignup.gameId === foundGame?.gameId)?.users
      .length ?? 0;

  useEffect(() => {
    setLoading(false);
  }, [foundGame]);

  return (
    <div>
      <BackButton />
      {loading && <Loading />}
      {foundGame && (
        <GameEntry
          isAlwaysExpanded={true}
          game={foundGame}
          startTime={foundGame.startTime}
          players={playerCount}
          signupStrategy={foundGame.signupStrategy ?? SignupStrategy.DIRECT}
          signedGames={ownOrGroupCreatorSignedGames}
          enteredGames={enteredGames}
          loading={loading}
          setLoading={setLoading}
          username={username}
          loggedIn={loggedIn}
          userGroup={userGroup}
          favoritedGames={favoritedGames}
        />
      )}
      {!loading && !foundGame && (
        <div>
          {t("invalidProgramItemId")} {gameId}.
        </div>
      )}
    </div>
  );
};

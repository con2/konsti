import React, { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Loading } from "client/components/Loading";
import { useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { GameEntry } from "client/views/all-games/components/GameEntry";
import {
  selectActiveEnteredGames,
  selectActiveSignedGames,
} from "client/views/my-games/myGamesSlice";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { getSignedGames } from "client/utils/getUpcomingGames";

export const GameDetails = (): ReactElement => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { gameId } = useParams();

  const games = useAppSelector((state) => state.allGames.games);
  const signups = useAppSelector((state) => state.allGames.signups);
  const activeEnteredGames = useAppSelector(selectActiveEnteredGames);
  const activeProgramType = useAppSelector(
    (state) => state.admin.activeProgramType
  );

  // Figure out if user has signed up to this game
  const activeSignedGames = useAppSelector(selectActiveSignedGames);
  const groupCode = useAppSelector((state) => state.group.groupCode);
  const groupMembers = useAppSelector((state) => state.group.groupMembers);
  const serial = useAppSelector((state) => state.login.serial);
  const ownOrGroupCreatorSignedGames = getSignedGames({
    signedGames: activeSignedGames,
    groupCode,
    serial,
    groupMembers,
    activeProgramType,
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
      <Button
        onClick={() => {
          // Navigate to front page if no previous page exists
          window.history.state?.idx > 0 ? navigate(-1) : navigate("/");
        }}
        buttonStyle={ButtonStyle.NORMAL}
      >
        {t("button.back")}
      </Button>
      {loading && <Loading />}
      {foundGame && (
        <GameEntry
          isAlwaysExpanded={true}
          game={foundGame}
          startTime={foundGame.startTime}
          players={playerCount}
          signupStrategy={foundGame.signupStrategy ?? SignupStrategy.DIRECT}
          signedGames={ownOrGroupCreatorSignedGames}
          enteredGames={activeEnteredGames}
        />
      )}
      {!loading && !foundGame && (
        <div>
          {t("invalidGameId")} {gameId}.
        </div>
      )}
    </div>
  );
};

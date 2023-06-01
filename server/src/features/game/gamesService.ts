import { getGamesFromKompassi } from "server/features/game/utils/getGamesFromKompassi";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { config } from "server/config";
import { kompassiGameMapper } from "server/utils/kompassiGameMapper";
import {
  PostUpdateGamesResponse,
  GetGamesResponse,
  PostUpdateGamesError,
  GetGamesError,
} from "shared/typings/api/games";
import { findGames, saveGames } from "server/features/game/gameRepository";
import { enrichGames } from "./gameUtils";
import { isErrorResult, unwrapResult } from "shared/utils/asyncResult";

export const updateGames = async (): Promise<
  PostUpdateGamesResponse | PostUpdateGamesError
> => {
  const kompassiGamesAsyncResult = await getGamesFromKompassi();
  if (isErrorResult(kompassiGamesAsyncResult)) {
    return {
      message: "Loading games from Kompassi failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const kompassiGames = unwrapResult(kompassiGamesAsyncResult);

  const saveGamesAsyncResult = await saveGames(
    kompassiGameMapper(kompassiGames)
  );
  if (isErrorResult(saveGamesAsyncResult)) {
    return {
      message: "Games db update failed: Saving games failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const gameSaveResponse = unwrapResult(saveGamesAsyncResult);
  if (!gameSaveResponse) {
    return {
      message: "Games db update failed: No save response",
      status: "error",
      errorId: "unknown",
    };
  }

  if (config.updateGamePopularityEnabled) {
    const updateGamePopularityAsyncResult = await updateGamePopularity();
    if (isErrorResult(updateGamePopularityAsyncResult)) {
      return {
        message: "Game popularity update failed",
        status: "error",
        errorId: "unknown",
      };
    }
  }

  return {
    message: "Games db updated",
    status: "success",
    games: gameSaveResponse,
  };
};

export const fetchGames = async (): Promise<
  GetGamesResponse | GetGamesError
> => {
  const gamesAsyncResult = await findGames();

  if (isErrorResult(gamesAsyncResult)) {
    return {
      message: `Downloading games failed`,
      status: "error",
      errorId: "unknown",
    };
  }

  const games = unwrapResult(gamesAsyncResult);

  const gamesWithPlayersAsyncResult = await enrichGames(games);
  if (isErrorResult(gamesWithPlayersAsyncResult)) {
    return {
      message: `Downloading games failed`,
      status: "error",
      errorId: "unknown",
    };
  }

  const gamesWithPlayers = unwrapResult(gamesWithPlayersAsyncResult);

  return {
    message: "Games downloaded",
    status: "success",
    games: gamesWithPlayers,
  };
};

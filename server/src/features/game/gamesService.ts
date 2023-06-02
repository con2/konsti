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
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const updateGames = async (): Promise<
  PostUpdateGamesResponse | PostUpdateGamesError
> => {
  const kompassiGamesResult = await getGamesFromKompassi();
  if (isErrorResult(kompassiGamesResult)) {
    return {
      message: "Loading games from Kompassi failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const kompassiGames = unwrapResult(kompassiGamesResult);

  const saveGamesResult = await saveGames(kompassiGameMapper(kompassiGames));
  if (isErrorResult(saveGamesResult)) {
    return {
      message: "Games db update failed: Saving games failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const gameSaveResponse = unwrapResult(saveGamesResult);
  if (!gameSaveResponse) {
    return {
      message: "Games db update failed: No save response",
      status: "error",
      errorId: "unknown",
    };
  }

  if (config.updateGamePopularityEnabled) {
    const updateGamePopularityResult = await updateGamePopularity();
    if (isErrorResult(updateGamePopularityResult)) {
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
  const gamesResult = await findGames();

  if (isErrorResult(gamesResult)) {
    return {
      message: `Downloading games failed`,
      status: "error",
      errorId: "unknown",
    };
  }

  const games = unwrapResult(gamesResult);

  const gamesWithPlayersResult = await enrichGames(games);
  if (isErrorResult(gamesWithPlayersResult)) {
    return {
      message: `Downloading games failed`,
      status: "error",
      errorId: "unknown",
    };
  }

  const gamesWithPlayers = unwrapResult(gamesWithPlayersResult);

  return {
    message: "Games downloaded",
    status: "success",
    games: gamesWithPlayers,
  };
};

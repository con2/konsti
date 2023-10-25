import { getGamesFromKompassi } from "server/features/game/utils/getGamesFromKompassi";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { serverConfig } from "server/serverConfig";
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
  const games = kompassiGameMapper(kompassiGames);

  const saveGamesResult = await saveGames(games);
  if (isErrorResult(saveGamesResult)) {
    return {
      message: "Games db update failed: Saving games failed",
      status: "error",
      errorId: "unknown",
    };
  }

  if (serverConfig.updateGamePopularityEnabled) {
    const updateGamePopularityResult = await updateGamePopularity();
    if (isErrorResult(updateGamePopularityResult)) {
      return {
        message: "Game popularity update failed",
        status: "error",
        errorId: "unknown",
      };
    }
  }

  const updatedGamesResult = await findGames();
  if (isErrorResult(updatedGamesResult)) {
    return {
      message: "Games db update failed: Error loading updated games",
      status: "error",
      errorId: "unknown",
    };
  }

  const updatedGames = unwrapResult(updatedGamesResult);

  return {
    message: "Games db updated",
    status: "success",
    games: updatedGames,
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

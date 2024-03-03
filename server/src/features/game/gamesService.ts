import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { config } from "shared/config";
import {
  PostUpdateGamesResponse,
  GetGamesResponse,
  PostUpdateGamesError,
  GetGamesError,
} from "shared/types/api/games";
import { findGames, saveGames } from "server/features/game/gameRepository";
import { enrichGames } from "./gameUtils";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { KompassiError } from "shared/types/api/errors";
import { Game } from "shared/types/models/game";
import { getGamesFromKompassi } from "server/kompassi/getGamesFromKompassi";
import { kompassiGameMapper } from "server/kompassi/kompassiGameMapper";

export const getGamesForConvention = async (): Promise<
  Result<readonly Game[], KompassiError>
> => {
  const conventionName = config.shared().conventionName;
  const kompassiGamesResult = await getGamesFromKompassi(conventionName);
  if (isErrorResult(kompassiGamesResult)) {
    return kompassiGamesResult;
  }

  const kompassiGames = unwrapResult(kompassiGamesResult);
  return makeSuccessResult(kompassiGameMapper(conventionName, kompassiGames));
};

export const updateGames = async (): Promise<
  PostUpdateGamesResponse | PostUpdateGamesError
> => {
  const gamesResult = await getGamesForConvention();
  if (isErrorResult(gamesResult)) {
    return {
      message: "Loading games from Kompassi failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const games = unwrapResult(gamesResult);
  const saveGamesResult = await saveGames(games);
  if (isErrorResult(saveGamesResult)) {
    return {
      message: "Games db update failed: Saving games failed",
      status: "error",
      errorId: "unknown",
    };
  }

  if (config.server().updateGamePopularityEnabled) {
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

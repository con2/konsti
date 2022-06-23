import { logger } from "server/utils/logger";
import { getGamesFromKompassi } from "server/features/game/utils/getGamesFromKompassi";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { config } from "server/config";
import { kompassiGameMapper } from "server/utils/kompassiGameMapper";
import { Game } from "shared/typings/models/game";
import { PostGamesResponse, GetGamesResponse } from "shared/typings/api/games";
import { findGames, saveGames } from "server/features/game/gameRepository";
import { ApiError } from "shared/typings/api/errors";
import { enrichGames } from "./gameUtils";
import { KompassiGame } from "shared/typings/models/kompassiGame";

export const storeGames = async (): Promise<PostGamesResponse | ApiError> => {
  let kompassiGames = [] as readonly KompassiGame[];
  try {
    kompassiGames = await getGamesFromKompassi();
  } catch (error) {
    logger.error(`Loading games from Kompassi failed: ${error}`);
    return {
      message: "Loading games from Kompassi failed",
      status: "error",
      errorId: "unknown",
    };
  }

  let gameSaveResponse: Game[];
  try {
    gameSaveResponse = await saveGames(kompassiGameMapper(kompassiGames));
  } catch (error) {
    logger.error(`saveGames error: ${error}`);
    return {
      message: "Games db update failed: Saving games failed",
      status: "error",
      errorId: "unknown",
    };
  }

  if (!gameSaveResponse) {
    return {
      message: "Games db update failed: No save response",
      status: "error",
      errorId: "unknown",
    };
  }

  if (config.updateGamePopularityEnabled) {
    try {
      await updateGamePopularity();
    } catch (error) {
      logger.error(`updateGamePopularity: ${error}`);
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

export const fetchGames = async (): Promise<GetGamesResponse | ApiError> => {
  try {
    const games = await findGames();
    const gamesWithPlayers = await enrichGames(games);

    return {
      message: "Games downloaded",
      status: "success",
      games: gamesWithPlayers,
    };
  } catch (error) {
    return {
      message: `Downloading games failed`,
      status: "error",
      errorId: "unknown",
    };
  }
};

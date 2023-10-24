import { getGamesFromKompassiRopecon } from "server/features/game/utils/getGamesFromKompassiRopecon";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { config } from "shared/config";
import { kompassiGameMapperRopecon } from "server/utils/kompassiGameMapperRopecon";
import {
  PostUpdateGamesResponse,
  GetGamesResponse,
  PostUpdateGamesError,
  GetGamesError,
} from "shared/typings/api/games";
import { findGames, saveGames } from "server/features/game/gameRepository";
import { enrichGames } from "./gameUtils";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { getGamesFromKompassiHitpoint } from "server/features/game/utils/getGamesFromKompassiHitpoint";
import { kompassiGameMapperHitpoint } from "server/utils/kompassiGameMapperHitpoint";
import { KompassiError } from "shared/typings/api/errors";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { Game } from "shared/typings/models/game";
import { ConventionName } from "shared/config/sharedConfigTypes";

const getGamesForConvention = async (
  conventionName: ConventionName,
): Promise<Result<readonly Game[], KompassiError>> => {
  if (conventionName === ConventionName.ROPECON) {
    const kompassiGamesResult = await getGamesFromKompassiRopecon();
    if (isErrorResult(kompassiGamesResult)) {
      return kompassiGamesResult;
    }

    const kompassiGames = unwrapResult(kompassiGamesResult);
    return makeSuccessResult(kompassiGameMapperRopecon(kompassiGames));
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (conventionName === ConventionName.HITPOINT) {
    const kompassiGamesResult = await getGamesFromKompassiHitpoint();
    if (isErrorResult(kompassiGamesResult)) {
      return kompassiGamesResult;
    }

    const kompassiGames = unwrapResult(kompassiGamesResult);
    return makeSuccessResult(kompassiGameMapperHitpoint(kompassiGames));
  }

  return exhaustiveSwitchGuard(conventionName);
};

export const updateGames = async (): Promise<
  PostUpdateGamesResponse | PostUpdateGamesError
> => {
  const gamesResult = await getGamesForConvention(
    config.shared().conventionName,
  );
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

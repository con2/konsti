import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { config } from "shared/config";
import {
  PostUpdateProgramItemsResponse,
  GetProgramItemsResponse,
  PostUpdateProgramItemsError,
  GetProgramItemsError,
} from "shared/types/api/programItems";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { enrichGames } from "./programItemUtils";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { KompassiError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { getProgramItemsFromKompassi } from "server/kompassi/getProgramItemsFromKompassi";
import { kompassiProgramItemMapper } from "server/kompassi/kompassiProgramItemMapper";

export const getGamesForConvention = async (): Promise<
  Result<readonly ProgramItem[], KompassiError>
> => {
  const conventionName = config.shared().conventionName;
  const kompassiGamesResult = await getProgramItemsFromKompassi(conventionName);
  if (isErrorResult(kompassiGamesResult)) {
    return kompassiGamesResult;
  }

  const kompassiGames = unwrapResult(kompassiGamesResult);
  return makeSuccessResult(
    kompassiProgramItemMapper(conventionName, kompassiGames),
  );
};

export const updateGames = async (): Promise<
  PostUpdateProgramItemsResponse | PostUpdateProgramItemsError
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
  const saveGamesResult = await saveProgramItems(games);
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

  const updatedGamesResult = await findProgramItems();
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
    programItems: updatedGames,
  };
};

export const fetchGames = async (): Promise<
  GetProgramItemsResponse | GetProgramItemsError
> => {
  const gamesResult = await findProgramItems();
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
    programItems: gamesWithPlayers,
  };
};

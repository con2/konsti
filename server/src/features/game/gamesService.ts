import { logger } from 'server/utils/logger';
import { updateGames } from 'server/utils/updateGames';
import { updateGamePopularity } from 'server/features/game-popularity/updateGamePopularity';
import { config } from 'server/config';
import { kompassiGameMapper } from 'server/utils/kompassiGameMapper';
import { KompassiGame } from 'server/typings/game.typings';
import { Game } from 'shared/typings/models/game';
import { PostGamesResponse, GetGamesResponse } from 'shared/typings/api/games';
import { findGames, saveGames } from 'server/features/game/gameRepository';

export const storeGames = async (): Promise<PostGamesResponse> => {
  let kompassiGames = [] as readonly KompassiGame[];
  try {
    kompassiGames = await updateGames();
  } catch (error) {
    return {
      message: 'Games db update failed',
      status: 'error',
      games: [],
    };
  }

  if (!kompassiGames || kompassiGames.length === 0) {
    return {
      message: 'Games db update failed: No games available',
      status: 'error',
      games: [],
    };
  }

  logger.info(`Found ${kompassiGames.length} games`);

  let gameSaveResponse: Game[];
  try {
    gameSaveResponse = await saveGames(kompassiGameMapper(kompassiGames));
  } catch (error) {
    logger.error(`saveGames error: ${error}`);
    return {
      message: 'Games db update failed: Saving games failed',
      status: 'error',
      games: [],
    };
  }

  if (!gameSaveResponse) {
    return {
      message: 'Games db update failed: No save response',
      status: 'error',
      games: [],
    };
  }

  if (config.updateGamePopularityEnabled) {
    try {
      await updateGamePopularity();
    } catch (error) {
      logger.error(`updateGamePopularity: ${error}`);
      return {
        message: 'Game popularity update failed',
        status: 'error',
        games: [],
      };
    }
  }

  return {
    message: 'Games db updated',
    status: 'success',
    games: gameSaveResponse,
  };
};

export const fetchGames = async (): Promise<GetGamesResponse> => {
  try {
    const games = await findGames();
    return {
      message: 'Games downloaded',
      status: 'success',
      games: games,
    };
  } catch (error) {
    return {
      message: `Downloading games failed: ${error.message}`,
      status: 'error',
      games: [],
    };
  }
};

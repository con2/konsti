import { logger } from 'server/utils/logger';
import { updateGames } from 'server/utils/updateGames';
import { updateGamePopularity } from 'server/features/game-popularity/updateGamePopularity';
import { config } from 'server/config';
import { kompassiGameMapper } from 'server/utils/kompassiGameMapper';
import { GameWithPlayerCount, KompassiGame } from 'server/typings/game.typings';
import { Game } from 'shared/typings/models/game';
import { PostGamesResponse, GetGamesResponse } from 'shared/typings/api/games';
import { findGames, saveGames } from 'server/features/game/gameRepository';
import { ServerError } from 'shared/typings/api/errors';
import { getNumPlayersInGames } from './gameUtils';

export const storeGames = async (): Promise<
  PostGamesResponse | ServerError
> => {
  let kompassiGames = [] as readonly KompassiGame[];
  try {
    kompassiGames = await updateGames();
  } catch (error) {
    return {
      message: 'Games db update failed',
      status: 'error',
      code: 0,
    };
  }

  if (!kompassiGames || kompassiGames.length === 0) {
    return {
      message: 'Games db update failed: No games available',
      status: 'error',
      code: 0,
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
      code: 0,
    };
  }

  if (!gameSaveResponse) {
    return {
      message: 'Games db update failed: No save response',
      status: 'error',
      code: 0,
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
        code: 0,
      };
    }
  }

  return {
    message: 'Games db updated',
    status: 'success',
    games: gameSaveResponse,
  };
};

export const fetchGames = async (): Promise<GetGamesResponse | ServerError> => {
  try {
    const games = await findGames();
    const numPlayers = await getNumPlayersInGames(games);

    const gamesWithPlayerCount: GameWithPlayerCount[] = [];
    for (const game of games) {
      const numPlayersInfo = numPlayers.find((n) => n.gameId === game.gameId);
      let num = -1;
      if (numPlayersInfo !== undefined) {
        num = numPlayersInfo.numPlayers;
      }
      gamesWithPlayerCount.push({
        game: game,
        players: num,
      });
    }
    return {
      message: 'Games downloaded',
      status: 'success',
      games: gamesWithPlayerCount,
    };
  } catch (error) {
    return {
      message: `Downloading games failed: ${error.message}`,
      status: 'error',
      code: 0,
    };
  }
};

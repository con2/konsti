import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { validateAuthHeader } from 'utils/authHeader';
import { updateGames } from 'utils/updateGames';
import { updateGamePopularity } from 'game-popularity/updateGamePopularity';
import { config } from 'config';
import { kompassiGameMapper } from 'utils/kompassiGameMapper';
import { Request, Response } from 'express';
import { UserGroup } from 'typings/user.typings';
import { KompassiGame } from 'typings/game.typings';

// Update games db from master data
const postGames = async (req: Request, res: Response): Promise<unknown> => {
  logger.info('API call: POST /api/games');

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  let kompassiGames = [] as readonly KompassiGame[];
  try {
    kompassiGames = await updateGames();
  } catch (error) {
    return res.json({
      message: 'Games db update failed',
      status: 'error',
    });
  }

  if (!kompassiGames || kompassiGames.length === 0) {
    return res.json({
      message: 'Games db update failed: No games available',
      status: 'error',
    });
  }

  logger.info(`Found ${kompassiGames.length} games`);

  let gameSaveResponse;
  try {
    gameSaveResponse = await db.game.saveGames(
      kompassiGameMapper(kompassiGames)
    );
  } catch (error) {
    logger.error(`db.game.saveGames error: ${error}`);
    return res.json({
      message: 'Games db update failed: Saving games failed',
      status: 'error',
    });
  }

  if (!gameSaveResponse) {
    return res.json({
      message: 'Games db update failed: No save response',
      status: 'error',
    });
  }

  if (config.updateGamePopularityEnabled) {
    try {
      await updateGamePopularity();
    } catch (error) {
      logger.error(`updateGamePopularity: ${error}`);
      return res.json({
        message: 'Game popularity update failed',
        status: 'error',
      });
    }
  }

  return res.json({
    message: 'Games db updated',
    status: 'success',
    games: gameSaveResponse,
  });
};

// Get games from db
const getGames = async (req: Request, res: Response): Promise<unknown> => {
  logger.info('API call: GET /api/games');

  let games;
  try {
    games = await db.game.findGames();

    return res.json({
      message: 'Games downloaded',
      status: 'success',
      games: games,
    });
  } catch (error) {
    return res.json({
      message: 'Downloading games failed',
      status: 'error',
      response: error,
    });
  }
};

export { postGames, getGames, updateGames };

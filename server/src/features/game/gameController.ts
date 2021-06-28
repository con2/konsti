import { Request, Response } from 'express';
import { isAuthorized } from 'server/utils/authHeader';
import { UserGroup } from 'shared/typings/models/user';
import { fetchGames, storeGames } from 'server/features/game/gamesService';
import { logger } from 'server/utils/logger';
import { GAMES_ENDPOINT } from 'shared/constants/apiEndpoints';

export const postGame = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${GAMES_ENDPOINT}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, 'admin')) {
    return res.sendStatus(401);
  }

  const response = await storeGames();
  return res.json(response);
};

export const getGames = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${GAMES_ENDPOINT}`);

  const response = await fetchGames();
  return res.json(response);
};

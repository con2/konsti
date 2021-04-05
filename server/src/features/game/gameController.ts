import { Request, Response } from 'express';
import { validateAuthHeader } from 'server/utils/authHeader';
import { UserGroup } from 'server/typings/user.typings';
import { fetchGames, storeGames } from 'server/features/game/gamesService';
import { logger } from 'server/utils/logger';
import { GAMES_ENDPOINT } from 'shared/constants/apiEndpoints';

export const postGame = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${GAMES_ENDPOINT}`);

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await storeGames();
  return res.send(response);
};

export const getGames = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${GAMES_ENDPOINT}`);

  const response = await fetchGames();
  return res.send(response);
};

import { Request, Response } from 'express';
import {
  removeEnteredGame,
  storeEnteredGame,
} from 'server/features/user/entered-game/enteredGameService';
import { isAuthorized } from 'server/utils/authHeader';
import { logger } from 'server/utils/logger';
import { ENTERED_GAME_ENDPOINT } from 'shared/constants/apiEndpoints';
import {
  DeleteEnteredGameParameters,
  DeleteEnteredGameParametersRuntype,
  PostEnteredGameParameters,
  PostEnteredGameParametersRuntype,
} from 'shared/typings/api/signup';
import { UserGroup } from 'shared/typings/models/user';

export const postEnteredGame = async (
  req: Request<{}, {}, PostEnteredGameParameters>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ENTERED_GAME_ENDPOINT}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.USER)) {
    return res.sendStatus(401);
  }

  try {
    PostEnteredGameParametersRuntype.check(req.body);
  } catch (error) {
    logger.info(
      `Error validating postEnteredGame parameters: ${error.message}`
    );
    return res.sendStatus(422);
  }

  const response = await storeEnteredGame(req.body);
  return res.json(response);
};

export const deleteEnteredGame = async (
  req: Request<{}, {}, DeleteEnteredGameParameters>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: DELETE ${ENTERED_GAME_ENDPOINT}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.USER)) {
    return res.sendStatus(401);
  }

  try {
    DeleteEnteredGameParametersRuntype.check(req.body);
  } catch (error) {
    logger.error(
      `Error validating deleteEnteredGame parameters: ${error.message}`
    );
    return res.sendStatus(422);
  }

  const response = await removeEnteredGame(req.body);
  return res.json(response);
};

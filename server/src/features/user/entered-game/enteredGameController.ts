import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  removeEnteredGame,
  storeEnteredGame,
} from "server/features/user/entered-game/enteredGameService";
import { isAuthorized } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  DeleteEnteredGameParameters,
  DeleteEnteredGameParametersSchema,
  PostEnteredGameParameters,
  PostEnteredGameParametersSchema,
} from "shared/typings/api/myGames";
import { UserGroup } from "shared/typings/models/user";

export const postEnteredGame = async (
  req: Request<{}, {}, PostEnteredGameParameters>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.ENTERED_GAME}`);

  const { username } = req.body;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  try {
    PostEnteredGameParametersSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.info(
        `Error validating postEnteredGame parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const response = await storeEnteredGame(req.body);
  return res.json(response);
};

export const deleteEnteredGame = async (
  req: Request<{}, {}, DeleteEnteredGameParameters>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: DELETE ${ApiEndpoint.ENTERED_GAME}`);

  const { username } = req.body;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  try {
    DeleteEnteredGameParametersSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating deleteEnteredGame parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const response = await removeEnteredGame(req.body);
  return res.json(response);
};

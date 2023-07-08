import { Request, Response } from "express";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  DeleteEnteredGameRequest,
  DeleteEnteredGameRequestSchema,
  PostEnteredGameRequest,
  PostEnteredGameRequestSchema,
} from "shared/typings/api/myGames";
import { UserGroup } from "shared/typings/models/user";
import {
  removeSignup,
  storeSignup,
} from "server/features/signup/signupService";

export const postSignup = async (
  req: Request<{}, {}, PostEnteredGameRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.SIGNUP}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostEnteredGameRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error("Error validating postSignup body: %s", result.error);
    return res.sendStatus(422);
  }

  const response = await storeSignup(result.data);
  return res.json(response);
};

export const deleteSignup = async (
  req: Request<{}, {}, DeleteEnteredGameRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: DELETE ${ApiEndpoint.SIGNUP}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = DeleteEnteredGameRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error("Error validating deleteSignup body: %s", result.error);
    return res.sendStatus(422);
  }

  const response = await removeSignup(result.data);
  return res.json(response);
};

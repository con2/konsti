import { Request, Response } from "express";
import { ZodError } from "zod";
import { isAuthorized } from "server/utils/authHeader";
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

  const username = isAuthorized(req.headers.authorization, UserGroup.USER);
  if (!username) {
    return res.sendStatus(401);
  }

  let body;
  try {
    body = PostEnteredGameRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.info(`Error validating postSignup body: ${error.message}`);
    }
    return res.sendStatus(422);
  }

  const response = await storeSignup(body);
  return res.json(response);
};

export const deleteSignup = async (
  req: Request<{}, {}, DeleteEnteredGameRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: DELETE ${ApiEndpoint.SIGNUP}`);

  const username = isAuthorized(req.headers.authorization, UserGroup.USER);
  if (!username) {
    return res.sendStatus(401);
  }

  let body;
  try {
    body = DeleteEnteredGameRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating deleteSignup body: ${error.message}`);
    }
    return res.sendStatus(422);
  }

  const response = await removeSignup(body);
  return res.json(response);
};

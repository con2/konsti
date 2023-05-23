import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  fetchSettings,
  storeHidden,
  storeSignupQuestion,
  removeSignupQuestion,
  updateSettings,
} from "server/features/settings/settingsService";
import { UserGroup } from "shared/typings/models/user";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  DeleteSignupQuestionRequest,
  PostHiddenRequest,
  PostSettingsRequest,
  PostSettingsRequestSchema,
  PostSignupQuestionRequest,
} from "shared/typings/api/settings";

export const postHidden = async (
  req: Request<{}, {}, PostHiddenRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.HIDDEN}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const hiddenData = req.body.hiddenData;
  const response = await storeHidden(hiddenData);
  return res.json(response);
};

export const getSettings = async (
  _req: Request<{}, {}, {}>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.SETTINGS}`);

  const response = await fetchSettings();
  return res.json(response);
};

export const postSignupQuestion = async (
  req: Request<{}, {}, PostSignupQuestionRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.SIGNUP_QUESTION}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const response = await storeSignupQuestion(req.body.signupQuestion);
  return res.json(response);
};

export const deleteSignupQuestion = async (
  req: Request<{}, {}, DeleteSignupQuestionRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: DELETE ${ApiEndpoint.SIGNUP_QUESTION}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const response = await removeSignupQuestion(req.body.gameId);
  return res.json(response);
};

export const postSettings = async (
  req: Request<{}, {}, PostSettingsRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.SETTINGS}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN
  );
  if (!username) {
    return res.sendStatus(401);
  }

  let body;
  try {
    body = PostSettingsRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating postSettings body: ${error.message}`);
    }
    return res.sendStatus(422);
  }

  const response = await updateSettings(body);
  return res.json(response);
};

import { Request, Response } from "express";
import {
  fetchSettings,
  storeHidden,
  storeSignupQuestion,
  removeSignupQuestion,
  updateSettings,
} from "server/features/settings/settingsService";
import { UserGroup } from "shared/types/models/user";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  DeleteSignupQuestionRequest,
  PostHiddenRequest,
  PostSettingsRequest,
  PostSettingsRequestSchema,
  PostSignupQuestionRequest,
} from "shared/types/api/settings";

export const postHidden = async (
  req: Request<{}, {}, PostHiddenRequest>,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.HIDDEN}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN,
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
  res: Response,
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.SETTINGS}`);

  const response = await fetchSettings();
  return res.json(response);
};

export const postSignupQuestion = async (
  req: Request<{}, {}, PostSignupQuestionRequest>,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.SIGNUP_QUESTION}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const response = await storeSignupQuestion(req.body.signupQuestion);
  return res.json(response);
};

export const deleteSignupQuestion = async (
  req: Request<{}, {}, DeleteSignupQuestionRequest>,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: DELETE ${ApiEndpoint.SIGNUP_QUESTION}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const response = await removeSignupQuestion(req.body.gameId);
  return res.json(response);
};

export const postSettings = async (
  req: Request<{}, {}, PostSettingsRequest>,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.SETTINGS}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostSettingsRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(`Error validating postSettings body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const response = await updateSettings(result.data);
  return res.json(response);
};

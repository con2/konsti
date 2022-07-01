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
import { isAuthorized } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { Game } from "shared/typings/models/game";
import { SignupQuestion } from "shared/typings/models/settings";
import {
  PostSettingsRequest,
  PostSettingsRequestSchema,
} from "shared/typings/api/settings";

export const postHidden = async (
  req: Request<{}, {}, { hiddenData: readonly Game[] }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.HIDDEN}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, "admin")) {
    return res.sendStatus(401);
  }

  const hiddenData = req.body.hiddenData;
  const response = await storeHidden(hiddenData);
  return res.json(response);
};

export const getSettings = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.SETTINGS}`);

  const response = await fetchSettings();
  return res.json(response);
};

export const postSignupQuestion = async (
  req: Request<{}, {}, { signupQuestion: SignupQuestion }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.SIGNUP_QUESTION}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, "admin")) {
    return res.sendStatus(401);
  }

  const response = await storeSignupQuestion(req.body.signupQuestion);
  return res.json(response);
};

export const deleteSignupQuestion = async (
  req: Request<{}, {}, { gameId: string }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: DELETE ${ApiEndpoint.SIGNUP_QUESTION}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, "admin")) {
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

  if (process.env.SETTINGS === "production") {
    if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, "admin")) {
      return res.sendStatus(401);
    }
  }

  let settings;
  try {
    settings = PostSettingsRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating postSettings parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const response = await updateSettings(settings);
  return res.json(response);
};

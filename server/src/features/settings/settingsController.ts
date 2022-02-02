import { Request, Response } from "express";
import {
  fetchSettings,
  toggleAppOpen,
  storeSignupTime,
  storeHidden,
  storeSignupMessage,
  removeSignupMessage,
  setSignupStrategy,
} from "server/features/settings/settingsService";
import { UserGroup } from "shared/typings/models/user";
import { isAuthorized } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import {
  HIDDEN_ENDPOINT,
  SETTINGS_ENDPOINT,
  SET_SIGNUP_STRATEGY_ENDPOINT,
  SIGNUPTIME_ENDPOINT,
  SIGNUP_MESSAGE_ENDPOINT,
  TOGGLE_APP_OPEN_ENDPOINT,
} from "shared/constants/apiEndpoints";
import { Game } from "shared/typings/models/game";
import { SignupMessage } from "shared/typings/models/settings";
import { SignupStrategy } from "shared/config/sharedConfig.types";

export const postHidden = async (
  req: Request<{}, {}, { hiddenData: readonly Game[] }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${HIDDEN_ENDPOINT}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, "admin")) {
    return res.sendStatus(401);
  }

  const hiddenData = req.body.hiddenData;
  const response = await storeHidden(hiddenData);
  return res.json(response);
};

export const postSignupTime = async (
  req: Request<{}, {}, { signupTime: string }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${SIGNUPTIME_ENDPOINT}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, "admin")) {
    return res.sendStatus(401);
  }

  const signupTime = req.body.signupTime;
  const response = await storeSignupTime(signupTime);
  return res.json(response);
};

export const postAppOpen = async (
  req: Request<{}, {}, { appOpen: boolean }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${TOGGLE_APP_OPEN_ENDPOINT}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, "admin")) {
    return res.sendStatus(401);
  }

  const appOpen = req.body.appOpen;
  const response = await toggleAppOpen(appOpen);
  return res.json(response);
};

export const postSignupStrategy = async (
  req: Request<{}, {}, { signupStrategy: SignupStrategy }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${SET_SIGNUP_STRATEGY_ENDPOINT}`);

  if (process.env.SETTINGS === "production") {
    if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, "admin")) {
      return res.sendStatus(401);
    }
  }

  const signupStrategy = req.body.signupStrategy;
  const response = await setSignupStrategy(signupStrategy);
  return res.json(response);
};

export const getSettings = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${SETTINGS_ENDPOINT}`);

  const response = await fetchSettings();
  return res.json(response);
};

export const postSignupMessage = async (
  req: Request<{}, {}, { signupMessage: SignupMessage }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${SIGNUP_MESSAGE_ENDPOINT}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, "admin")) {
    return res.sendStatus(401);
  }

  const response = await storeSignupMessage(req.body.signupMessage);
  return res.json(response);
};

export const deleteSignupMessage = async (
  req: Request<{}, {}, { gameId: string }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: DELETE ${SIGNUP_MESSAGE_ENDPOINT}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, "admin")) {
    return res.sendStatus(401);
  }

  const response = await removeSignupMessage(req.body.gameId);
  return res.json(response);
};

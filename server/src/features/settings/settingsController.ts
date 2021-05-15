import { Request, Response } from 'express';
import {
  fetchSettings,
  toggleAppOpen,
  storeSignupTime,
  storeHidden,
} from 'server/features/settings/settingsService';
import { UserGroup } from 'shared/typings/models/user';
import { isAuthorized } from 'server/utils/authHeader';
import { logger } from 'server/utils/logger';
import {
  HIDDEN_ENDPOINT,
  SETTINGS_ENDPOINT,
  SIGNUPTIME_ENDPOINT,
  TOGGLE_APP_OPEN_ENDPOINT,
} from 'shared/constants/apiEndpoints';
import { Game } from 'shared/typings/models/game';

export const postHidden = async (
  req: Request<{}, {}, { hiddenData: readonly Game[] }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${HIDDEN_ENDPOINT}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN)) {
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

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN)) {
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

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN)) {
    return res.sendStatus(401);
  }

  const appOpen = req.body.appOpen;
  const response = await toggleAppOpen(appOpen);
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

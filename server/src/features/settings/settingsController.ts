import { Request, Response } from 'express';
import {
  fetchSettings,
  toggleAppOpen,
  storeSignupTime,
  storeHidden,
} from 'server/features/settings/settingsService';
import { UserGroup } from 'shared/typings/models/user';
import { validateAuthHeader } from 'server/utils/authHeader';
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

  const hiddenData = req.body.hiddenData;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.ADMIN
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await storeHidden(hiddenData);
  return res.send(response);
};

export const postSignupTime = async (
  req: Request<{}, {}, { signupTime: string }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${SIGNUPTIME_ENDPOINT}`);

  const signupTime = req.body.signupTime;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.ADMIN
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await storeSignupTime(signupTime);
  return res.send(response);
};

export const postAppOpen = async (
  req: Request<{}, {}, { appOpen: boolean }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${TOGGLE_APP_OPEN_ENDPOINT}`);

  const appOpen = req.body.appOpen;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.ADMIN
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await toggleAppOpen(appOpen);
  return res.send(response);
};

export const getSettings = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${SETTINGS_ENDPOINT}`);

  const response = await fetchSettings();
  return res.send(response);
};

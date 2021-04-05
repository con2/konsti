import { Request, Response } from 'express';
import { storeHidden } from 'server/features/settings/hiddenService';
import { fetchSettings } from 'server/features/settings/settingsService';
import { storeSignupTime } from 'server/features/settings/signuptimeService';
import { toggleAppOpen } from 'server/features/settings/toggleAppOpenService';
import { UserGroup } from 'server/typings/user.typings';
import { validateAuthHeader } from 'server/utils/authHeader';
import { logger } from 'server/utils/logger';
import {
  HIDDEN_ENDPOINT,
  SETTINGS_ENDPOINT,
  SIGNUPTIME_ENDPOINT,
  TOGGLE_APP_OPEN_ENDPOINT,
} from 'shared/constants/apiEndpoints';

export const postHidden = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${HIDDEN_ENDPOINT}`);

  const hiddenData = req.body.hiddenData;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await storeHidden(hiddenData);
  return res.send(response);
};

export const postSignupTime = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${SIGNUPTIME_ENDPOINT}`);

  const signupTime = req.body.signupTime;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await storeSignupTime(signupTime);
  return res.send(response);
};

export const postAppOpen = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${TOGGLE_APP_OPEN_ENDPOINT}`);

  const appOpen = req.body.appOpen;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
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

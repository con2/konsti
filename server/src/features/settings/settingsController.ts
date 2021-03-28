import { Request, Response } from 'express';
import { storeHidden } from 'server/features/settings/hiddenService';
import { fetchSettings } from 'server/features/settings/settingsService';
import { storeSignupTime } from 'server/features/settings/signuptimeService';
import { toggleAppOpen } from 'server/features/settings/toggleAppOpenService';
import { UserGroup } from 'server/typings/user.typings';
import { validateAuthHeader } from 'server/utils/authHeader';
import { logger } from 'server/utils/logger';

export const postHidden = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info('API call: POST /api/hidden');

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
  logger.info('API call: POST /api/signuptime');

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
  logger.info('API call: POST /api/toggle-app-open');

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
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info('API call: GET /api/settings');

  const response = await fetchSettings();
  return res.send(response);
};

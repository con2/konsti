import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { validateAuthHeader } from 'utils/authHeader';
import { Request, Response } from 'express';
import { UserGroup } from 'typings/user.typings';

export const toggleAppOpen = async (
  req: Request,
  res: Response
): Promise<unknown> => {
  logger.info('API call: POST /api/toggle-app-open');
  const appOpen = req.body.appOpen;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  try {
    const response = await db.settings.saveToggleAppOpen(appOpen);
    return res.json({
      message: 'Update app open success',
      status: 'success',
      appOpen: response.appOpen,
    });
  } catch (error) {
    return res.json({
      message: 'Update app open failure',
      status: 'error',
      error,
    });
  }
};

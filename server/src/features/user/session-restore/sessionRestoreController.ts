import { Request, Response } from 'express';
import { loginWithJwt } from 'server/features/user/session-restore/sessionRestoreService';
import { logger } from 'server/utils/logger';
import { SESSION_RESTORE_ENDPOINT } from 'shared/constants/apiEndpoints';
import { SessionRecoveryRequest } from 'shared/typings/api/login';

export const postSessionRestore = async (
  req: Request<{}, {}, SessionRecoveryRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${SESSION_RESTORE_ENDPOINT}`);

  const { jwt } = req.body;

  if (!jwt) {
    return res.sendStatus(422);
  }

  const response = await loginWithJwt(jwt);
  return res.json(response);
};

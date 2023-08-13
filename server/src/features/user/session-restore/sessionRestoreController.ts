import { Request, Response } from "express";
import { loginWithJwt } from "server/features/user/session-restore/sessionRestoreService";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostSessionRecoveryRequest } from "shared/typings/api/login";

export const postSessionRestore = async (
  req: Request<{}, {}, PostSessionRecoveryRequest>,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.SESSION_RESTORE}`);

  const { jwt } = req.body;

  if (!jwt) {
    return res.sendStatus(422);
  }

  const response = await loginWithJwt(jwt);
  return res.json(response);
};

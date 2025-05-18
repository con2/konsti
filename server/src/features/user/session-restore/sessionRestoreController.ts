import { Request, Response } from "express";
import { loginWithJwt } from "server/features/user/session-restore/sessionRestoreService";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostSessionRecoveryRequestSchema } from "shared/types/api/login";

export const postSessionRestore = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.SESSION_RESTORE}`);

  const result = PostSessionRecoveryRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(
        `Error validating postSessionRestore body: ${JSON.stringify(result.error)}`,
      ),
    );
    return res.sendStatus(422);
  }

  const { jwt } = result.data;

  const response = await loginWithJwt(jwt);
  return res.json(response);
};

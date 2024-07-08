import { Request, Response } from "express";
import { storeEventLogItemIsSeen } from "server/features/user/event-log/eventLogService";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostEventLogIsSeenRequest,
  PostEventLogIsSeenRequestSchema,
} from "shared/types/api/eventLog";
import { UserGroup } from "shared/types/models/user";

export const postEventLogItemIsSeen = async (
  req: Request<{}, {}, PostEventLogIsSeenRequest>,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.EVENT_LOG_IS_SEEN}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostEventLogIsSeenRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(
        `Error validating postEventLogItemIsSeen body: ${result.error}`,
      ),
    );
    return res.sendStatus(422);
  }

  const response = await storeEventLogItemIsSeen(result.data);
  return res.json(response);
};

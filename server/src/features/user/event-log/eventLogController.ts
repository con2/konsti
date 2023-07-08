import { Request, Response } from "express";
import { storeEventLogItem } from "server/features/user/event-log/eventLogService";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostEventLogIsSeenRequest,
  PostEventLogIsSeenRequestSchema,
} from "shared/typings/api/eventLog";
import { UserGroup } from "shared/typings/models/user";

export const postEventLogItem = async (
  req: Request<{}, {}, PostEventLogIsSeenRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.EVENT_LOG}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER
  );
  if (!username) {
    return res.sendStatus(401);
  }

  let body;
  try {
    body = PostEventLogIsSeenRequestSchema.parse(req.body);
  } catch (error) {
    logger.error("Error validating postEventLogItem body: %s", error);
    return res.sendStatus(422);
  }

  const response = await storeEventLogItem(body);
  return res.json(response);
};

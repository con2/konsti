import { Request, Response } from "express";
import { storeActionLogItem } from "server/features/user/action-log/actionLogService";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostActionLogIsSeenRequest,
  PostActionLogIsSeenRequestSchema,
} from "shared/typings/api/actionLog";
import { UserGroup } from "shared/typings/models/user";

export const postActionLogItem = async (
  req: Request<{}, {}, PostActionLogIsSeenRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.ACTION_LOG}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER
  );
  if (!username) {
    return res.sendStatus(401);
  }

  let body;
  try {
    body = PostActionLogIsSeenRequestSchema.parse(req.body);
  } catch (error) {
    logger.info("Error validating postActionLogItem body: %s", error);
    return res.sendStatus(422);
  }

  const response = await storeActionLogItem(body);
  return res.json(response);
};

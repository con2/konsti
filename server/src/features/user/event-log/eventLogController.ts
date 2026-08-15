import { Request, Response } from "express";
import { PostEventLogIsSeenRequest } from "shared/types/api/eventLog";
import { storeEventLogItemIsSeen } from "server/features/user/event-log/eventLogService";
import { getAuthUsername } from "server/middleware/requireAuth";

export const postEventLogItemIsSeen = async (
  req: Request<unknown, unknown, PostEventLogIsSeenRequest>,
  res: Response,
): Promise<Response> => {
  const response = await storeEventLogItemIsSeen(
    req.body,
    getAuthUsername(req),
  );
  return res.json(response);
};

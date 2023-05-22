import { Request, Response } from "express";
import { isAuthorized } from "server/utils/authHeader";
import { UserGroup } from "shared/typings/models/user";
import { storeFeedback } from "server/features/feedback/feedbackService";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostFeedbackRequest,
  PostFeedbackRequestSchema,
} from "shared/typings/api/feedback";

export const postFeedback = async (
  req: Request<{}, {}, PostFeedbackRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.FEEDBACK}`);

  const username = isAuthorized(req.headers.authorization, UserGroup.USER);
  if (!username) {
    return res.sendStatus(401);
  }

  let parameters;
  try {
    parameters = PostFeedbackRequestSchema.parse(req.body);
  } catch (error) {
    return res.sendStatus(422);
  }

  const response = await storeFeedback({
    gameId: parameters.gameId,
    feedback: parameters.feedback,
    username,
  });
  return res.json(response);
};

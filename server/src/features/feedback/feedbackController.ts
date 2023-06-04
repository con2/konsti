import { Request, Response } from "express";
import { ZodError } from "zod";
import { getAuthorizedUsername } from "server/utils/authHeader";
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

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER
  );
  if (!username) {
    return res.sendStatus(401);
  }

  let body;
  try {
    body = PostFeedbackRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error("Error validating postFeedback body: %s", error);
    }
    return res.sendStatus(422);
  }

  const response = await storeFeedback({
    gameId: body.gameId,
    feedback: body.feedback,
    username,
  });
  return res.json(response);
};

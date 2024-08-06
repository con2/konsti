import { Request, Response } from "express";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { UserGroup } from "shared/types/models/user";
import { storeFeedback } from "server/features/feedback/feedbackService";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostFeedbackRequestSchema } from "shared/types/api/feedback";

export const postFeedback = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.FEEDBACK}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostFeedbackRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(`Error validating postFeedback body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const { programItemId, feedback } = result.data;
  const response = await storeFeedback({ programItemId, feedback, username });
  return res.json(response);
};

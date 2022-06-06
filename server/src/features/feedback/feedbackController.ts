import { Request, Response } from "express";
import { isAuthorized } from "server/utils/authHeader";
import { UserGroup } from "shared/typings/models/user";
import { storeFeedback } from "server/features/feedback/feedbackService";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { Feedback, FeedbackSchema } from "shared/typings/models/feedback";

export const postFeedback = async (
  req: Request<{}, {}, Feedback>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.FEEDBACK}`);

  let parameters;
  try {
    parameters = FeedbackSchema.parse(req.body);
  } catch (error) {
    return res.sendStatus(422);
  }

  if (
    !isAuthorized(
      req.headers.authorization,
      UserGroup.USER,
      parameters.username
    )
  ) {
    return res.sendStatus(401);
  }

  const response = await storeFeedback(parameters);
  return res.json(response);
};

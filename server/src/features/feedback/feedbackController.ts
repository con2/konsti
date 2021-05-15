import { Request, Response } from 'express';
import { isAuthorized } from 'server/utils/authHeader';
import { UserGroup } from 'shared/typings/models/user';
import { storeFeedback } from 'server/features/feedback/feedbackService';
import { logger } from 'server/utils/logger';
import { FEEDBACK_ENDPOINT } from 'shared/constants/apiEndpoints';
import { Feedback } from 'shared/typings/models/feedback';

export const postFeedback = async (
  req: Request<{}, {}, { feedbackData: Feedback }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${FEEDBACK_ENDPOINT}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.USER)) {
    return res.sendStatus(401);
  }

  const feedbackData = req.body.feedbackData;
  const response = await storeFeedback(feedbackData);
  return res.json(response);
};

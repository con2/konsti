import { Request, Response } from 'express';
import { validateAuthHeader } from 'server/utils/authHeader';
import { UserGroup } from 'server/typings/user.typings';
import { storeFeedback } from 'server/features/feedback/feedbackService';
import { logger } from 'server/utils/logger';

export const postFeedback = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info('API call: POST /api/feedback');

  const feedbackData = req.body.feedbackData;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await storeFeedback(feedbackData);
  return res.send(response);
};

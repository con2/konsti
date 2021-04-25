import { Request, Response } from 'express';
import { validateAuthHeader } from 'server/utils/authHeader';
import { UserGroup } from 'server/typings/user.typings';
import { storeFeedback } from 'server/features/feedback/feedbackService';
import { logger } from 'server/utils/logger';
import { FEEDBACK_ENDPOINT } from 'shared/constants/apiEndpoints';

export const postFeedback = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${FEEDBACK_ENDPOINT}`);

  const feedbackData = req.body.feedbackData;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.USER
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await storeFeedback(feedbackData);
  return res.send(response);
};

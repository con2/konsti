import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { validateAuthHeader } from 'utils/authHeader';
import { Request, Response } from 'express';
import { UserGroup } from 'typings/user.typings';

// Post feedback data
const postFeedback = async (req: Request, res: Response): Promise<unknown> => {
  logger.info('API call: POST /api/feedback');
  const feedbackData = req.body.feedbackData;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  try {
    await db.feedback.saveFeedback(feedbackData);
    return res.json({
      message: 'Post feedback success',
      status: 'success',
    });
  } catch (error) {
    return res.json({
      message: 'Post feedback failure',
      status: 'error',
      error,
    });
  }
};

export { postFeedback };

import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { validateAuthHeader } from 'utils/authHeader';
import { Request, Response } from 'express';
import { UserGroup } from 'typings/user.typings';

// Add open signup time to server settings
const postSignupTime = async (
  req: Request,
  res: Response
): Promise<unknown> => {
  logger.info('API call: POST /api/signuptime');
  const signupTime = req.body.signupTime;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  try {
    const response = await db.settings.saveSignupTime(signupTime);
    return res.json({
      message: 'Signup time set success',
      status: 'success',
      signupTime: response.signupTime,
    });
  } catch (error) {
    return res.json({
      message: 'Signup time set failure',
      status: 'error',
      error,
    });
  }
};

export { postSignupTime };

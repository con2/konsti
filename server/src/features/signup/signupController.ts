import { Request, Response } from 'express';
import { storeSignup } from 'server/features/signup/signupService';
import { UserGroup } from 'shared/typings/models/user';
import { validateAuthHeader } from 'server/utils/authHeader';
import { logger } from 'server/utils/logger';
import { SIGNUP_ENDPOINT } from 'shared/constants/apiEndpoints';

export const postSignup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${SIGNUP_ENDPOINT}`);

  const signupData = req.body.signupData;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.USER
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const { selectedGames, username, signupTime } = signupData;

  const response = await storeSignup(selectedGames, username, signupTime);
  return res.send(response);
};

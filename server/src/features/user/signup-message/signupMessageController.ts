import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { UserGroup } from "shared/types/models/user";
import { fetchSignupMessages } from "server/features/user/signup-message/signupMessageService";

export const getSignupMessages = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.SIGNUP_MESSAGE}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.HELP,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const response = await fetchSignupMessages();
  return res.json(response);
};

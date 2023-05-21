import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { isAuthorized } from "server/utils/authHeader";
import { UserGroup } from "shared/typings/models/user";
import { fetchSignupMessages } from "server/features/user/signup-message/signupMessageService";

export const getSignupMessages = async (
  req: Request<{}, {}, {}>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.SIGNUP_MESSAGE}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.HELP, "helper")) {
    return res.sendStatus(401);
  }

  const response = await fetchSignupMessages();
  return res.json(response);
};

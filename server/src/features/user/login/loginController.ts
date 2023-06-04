import { Request, Response } from "express";
import { login } from "server/features/user/login/loginService";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostLoginRequest,
  PostLoginRequestSchema,
} from "shared/typings/api/login";

export const postLogin = async (
  req: Request<{}, {}, PostLoginRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.LOGIN}`);

  let body;
  try {
    body = PostLoginRequestSchema.parse(req.body);
  } catch (error) {
    logger.error("Error validating postLogin body: %s", error);
    return res.sendStatus(422);
  }

  const { username, password } = body;
  const response = await login(username, password);
  return res.json(response);
};

import { Request, Response } from "express";
import { login } from "server/features/user/login/loginService";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { LoginFormFields } from "shared/typings/api/login";

export const postLogin = async (
  req: Request<{}, {}, LoginFormFields>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.LOGIN}`);

  const { username, password } = req.body;

  if (!username || !password) {
    return res.sendStatus(422);
  }

  const response = await login(username, password);
  return res.json(response);
};

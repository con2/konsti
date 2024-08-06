import { Request, Response } from "express";
import { login } from "server/features/user/login/loginService";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostLoginRequestSchema } from "shared/types/api/login";

export const postLogin = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.LOGIN}`);

  const result = PostLoginRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(`Error validating postLogin body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const { username, password } = result.data;
  const response = await login(username, password);
  return res.json(response);
};

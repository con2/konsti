import { Request, Response } from "express";
import { ZodError, z } from "zod";
import { login } from "server/features/user/login/loginService";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostLoginRequest } from "shared/typings/api/login";

export const postLogin = async (
  req: Request<{}, {}, PostLoginRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.LOGIN}`);

  const PostUserPasswordParameters = z.object({
    username: z.string(),
    password: z.string(),
  });

  let parameters;
  try {
    parameters = PostUserPasswordParameters.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating postLogin parameters: ${error.message}`);
    }
    return res.sendStatus(422);
  }

  const { username, password } = parameters;
  const response = await login(username, password);
  return res.json(response);
};

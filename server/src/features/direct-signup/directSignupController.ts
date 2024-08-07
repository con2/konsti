import { Request, Response } from "express";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  DeleteDirectSignupRequestSchema,
  PostDirectSignupRequestSchema,
} from "shared/types/api/myProgramItems";
import { UserGroup } from "shared/types/models/user";
import {
  removeDirectSignup,
  storeDirectSignup,
} from "server/features/direct-signup/directSignupService";

export const postDirectSignup = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.DIRECT_SIGNUP}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostDirectSignupRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      new Error(`Error validating postDirectSignup body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const response = await storeDirectSignup(result.data);
  return res.json(response);
};

export const deleteDirectSignup = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: DELETE ${ApiEndpoint.DIRECT_SIGNUP}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = DeleteDirectSignupRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      new Error(`Error validating deleteDirectSignup body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const response = await removeDirectSignup(result.data);
  return res.json(response);
};

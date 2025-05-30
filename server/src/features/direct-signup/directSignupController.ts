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
      new Error(
        `Error validating postDirectSignup body: ${JSON.stringify(result.error)}`,
      ),
    );
    return res.sendStatus(422);
  }

  const response = await storeDirectSignup(result.data, username);
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
      new Error(
        `Error validating deleteDirectSignup body: ${JSON.stringify(result.error)}`,
      ),
    );
    return res.sendStatus(422);
  }

  const response = await removeDirectSignup(result.data, username);
  return res.json(response);
};

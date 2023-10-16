import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import {
  doKompassiLogin,
  verifyKompassiLogin,
} from "server/features/kompassiLogin/kompassiLoginService";
import { ApiEndpoint, AuthEndpoint } from "shared/constants/apiEndpoints";
import {
  PostKompassiLoginRequestSchema,
  PostVerifyKompassiLoginRequestSchema,
} from "shared/typings/api/login";
import { getAuthUrl } from "server/features/kompassiLogin/kompassiLoginUtils";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { UserGroup } from "shared/typings/models/user";

export const getKompassiLoginRedirect = (
  req: Request<{}, {}, {}>,
  res: Response,
): Response => {
  logger.info(`API call: GET ${AuthEndpoint.KOMPASSI_LOGIN}`);

  if (!req.headers.origin) {
    return res.sendStatus(422);
  }

  return res.status(302).json({
    location: getAuthUrl(req.headers.origin),
  });
};

export const postKompassiLoginCallback = async (
  req: Request<{}, {}, string>,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${AuthEndpoint.KOMPASSI_CALLBACK}`);

  if (!req.headers.origin) {
    return res.sendStatus(422);
  }

  const result = PostKompassiLoginRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(
        `Error validating postKompassiLoginCallback body: ${result.error}`,
      ),
    );
    return res.sendStatus(422);
  }
  const { code } = result.data;

  const response = await doKompassiLogin(code, req.headers.origin);
  return res.json(response);
};

export const postVerifyKompassiLogin = async (
  req: Request<{}, {}, string>,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.VERIFY_KOMPASSI_LOGIN}`);

  const jwtUsername = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER,
  );
  if (!jwtUsername) {
    return res.sendStatus(401);
  }

  const result = PostVerifyKompassiLoginRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(
        `Error validating postVerifyKompassiLogin body: ${result.error}`,
      ),
    );
    return res.sendStatus(422);
  }

  const { username, kompassiId } = result.data;
  const response = await verifyKompassiLogin(username, kompassiId);
  return res.json(response);
};

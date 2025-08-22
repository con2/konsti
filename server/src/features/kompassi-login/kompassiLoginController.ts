import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import {
  getBaseUrl,
  doKompassiLogin,
  verifyKompassiLogin,
  verifyUpdateUserEmailAddress,
} from "server/features/kompassi-login/kompassiLoginService";
import { ApiEndpoint, AuthEndpoint } from "shared/constants/apiEndpoints";
import {
  PostKompassiLoginRequestSchema,
  PostUpdateUserEmailAddressRequestSchema,
  PostVerifyKompassiLoginRequestSchema,
} from "shared/types/api/login";
import { getAuthUrl } from "server/features/kompassi-login/kompassiLoginUtils";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { UserGroup } from "shared/types/models/user";
import { updateUserEmailAddress } from "server/features/user/userRepository";

export const postKompassiLoginRedirect = (
  req: Request,
  res: Response,
): Response => {
  logger.info(`API call: POST ${AuthEndpoint.KOMPASSI_LOGIN}`);

  if (!req.headers.origin) {
    return res.sendStatus(422);
  }

  return res.status(302).json({
    location: getAuthUrl(req.headers.origin),
  });
};

export const postKompassiLoginCallback = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${AuthEndpoint.KOMPASSI_LOGIN_CALLBACK}`);

  if (!req.headers.origin) {
    return res.sendStatus(422);
  }

  const result = PostKompassiLoginRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(
        `Error validating postKompassiLoginCallback body: ${JSON.stringify(result.error)}`,
      ),
    );
    return res.sendStatus(422);
  }
  const { code } = result.data;

  const response = await doKompassiLogin(code, req.headers.origin);
  return res.json(response);
};

export const postVerifyKompassiLogin = async (
  req: Request,
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
        `Error validating postVerifyKompassiLogin body: ${JSON.stringify(result.error)}`,
      ),
    );
    return res.sendStatus(422);
  }

  const { username } = result.data;
  const response = await verifyKompassiLogin(jwtUsername, username);
  return res.json(response);
};

export const postUpdateUserEmailAddress = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.UPDATE_USER_EMAIL_ADDRESS}`);

  const jwtUsername = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER,
  );
  if (!jwtUsername) {
    return res.sendStatus(401);
  }

  const result = PostUpdateUserEmailAddressRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(
        `Error validating postUpdateUserEmailAddress body: ${JSON.stringify(result.error)}`,
      ),
    );
    return res.sendStatus(422);
  }

  const { email } = result.data;
  const response = await verifyUpdateUserEmailAddress(jwtUsername, email);
  return res.json(response);
};

export const postKompassiLogoutRedirect = (
  req: Request,
  res: Response,
): Response => {
  logger.info(`API call: POST ${AuthEndpoint.KOMPASSI_LOGOUT}`);

  if (!req.headers.origin) {
    return res.sendStatus(422);
  }

  return res.status(302).json({
    location: `${getBaseUrl()}/logout?next=${
      req.headers.origin
    }/kompassi-logout-callback`,
  });
};

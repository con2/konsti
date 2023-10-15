import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import {
  getAuthUrl,
  getProfile,
  getToken,
  parseProfile,
} from "server/features/kompassiLogin/kompassiLoginService";
import { AuthEndpoint } from "shared/constants/apiEndpoints";
import { PostKompassiLoginRequestSchema } from "shared/typings/api/login";

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
      new Error(`Error validating doLogin query: ${result.error}`),
    );
    return res.sendStatus(422);
  }
  const { code } = result.data;

  const tokens = await getToken(code, req.headers.origin);
  const profile = await getProfile(tokens.access_token);

  const response = await parseProfile(profile);
  return res.json(response);
};

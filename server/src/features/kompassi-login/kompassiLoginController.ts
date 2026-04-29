import { Request, Response } from "express";
import {
  getBaseUrl,
  doKompassiLogin,
  verifyKompassiLogin,
} from "server/features/kompassi-login/kompassiLoginService";
import {
  PostKompassiLoginRequest,
  PostVerifyKompassiLoginRequest,
} from "shared/types/api/login";
import { getAuthUrl } from "server/features/kompassi-login/kompassiLoginUtils";
import { getAuthUsername } from "server/middleware/requireAuth";

export const postKompassiLoginRedirect = (
  req: Request,
  res: Response,
): Response => {
  if (!req.headers.origin) {
    return res.sendStatus(422);
  }

  return res.status(302).json({
    location: getAuthUrl(req.headers.origin),
  });
};

export const postKompassiLoginCallback = async (
  req: Request<unknown, unknown, PostKompassiLoginRequest>,
  res: Response,
): Promise<Response> => {
  if (!req.headers.origin) {
    return res.sendStatus(422);
  }

  const { code } = req.body;

  const response = await doKompassiLogin(code, req.headers.origin);
  return res.json(response);
};

export const postVerifyKompassiLogin = async (
  req: Request<unknown, unknown, PostVerifyKompassiLoginRequest>,
  res: Response,
): Promise<Response> => {
  const { username } = req.body;
  const response = await verifyKompassiLogin(getAuthUsername(req), username);
  return res.json(response);
};

export const postKompassiLogoutRedirect = (
  req: Request,
  res: Response,
): Response => {
  if (!req.headers.origin) {
    return res.sendStatus(422);
  }

  return res.status(302).json({
    location: `${getBaseUrl()}/logout?next=${
      req.headers.origin
    }/kompassi-logout-callback`,
  });
};

import { Request, Response } from "express";
import { z } from "zod";
import {
  KompassiTokens,
  KompassiUserinfo,
} from "server/features/kompassi-login/KompassiLoginTypes";

const accessToken = "fi9crnvvDdMDjKoetkgXwQZAhj4RFN";
const tokenType = "Bearer";
const scope = "openid profile email";

const KompassiLoginResponseSchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string(),
  redirect_uri: z.string(),
  scope: z.literal(scope),
  state: z.string(),
});

export const getKompassiLoginMockRedirect = (
  req: Request,
  res: Response,
): void => {
  const result = KompassiLoginResponseSchema.safeParse(req.query);
  if (!result.success) {
    // eslint-disable-next-line no-restricted-syntax -- We want to throw if test fails
    throw new Error("Invalid Kompassi login mock service response data", {
      cause: result.error,
    });
  }

  const redirectUri = result.data.redirect_uri;
  const code = "S8gxcP4hFeU3Q6Jrpjp8sU8f82qvy7";

  res.redirect(`${redirectUri}?code=${code}&state=${result.data.state}`);
};

const KompassiLoginTokenSchema = z.object({
  code: z.string(),
  grant_type: z.string(),
  client_id: z.string(),
  client_secret: z.string(),
  redirect_uri: z.string(),
});

export const getKompassiLoginMockToken = (
  req: Request,
  res: Response,
): void => {
  const result = KompassiLoginTokenSchema.safeParse(req.body);
  if (!result.success) {
    // eslint-disable-next-line no-restricted-syntax -- We want to throw if test fails
    throw new Error("Invalid Kompassi login mock service token response data", {
      cause: result.error,
    });
  }

  const response: KompassiTokens = {
    access_token: accessToken,
    expires_in: 36000,
    token_type: tokenType,
    scope,
    refresh_token: "fw66oZDSDXDdx4R6UM4cu9mJ27tW49",
    // Included so the mock matches the real response shape. Nothing reads it:
    // the claims come from the userinfo endpoint.
    id_token: "kompassi-login-mock-id-token",
  };

  res.json(response);
};

export const getKompassiLoginMockUserinfo = (
  req: Request,
  res: Response,
): void => {
  if (req.headers.authorization !== `${tokenType} ${accessToken}`) {
    // eslint-disable-next-line no-restricted-syntax -- We want to throw if test fails
    throw new Error(
      "Invalid Kompassi login mock service userinfo access token",
    );
  }

  const response: KompassiUserinfo = {
    sub: "99",
    email: "firstname.lastname@example.com",
    name: 'Firstname "Nickname" Surname',
    given_name: "Firstname",
    family_name: "Surname",
    groups: ["users"],
  };

  res.json(response);
};

const KompassiLoginLogoutSchema = z.object({
  next: z.string(),
});

export const getKompassiLoginMockLogout = (
  req: Request,
  res: Response,
): void => {
  const result = KompassiLoginLogoutSchema.safeParse(req.query);
  if (!result.success) {
    // eslint-disable-next-line no-restricted-syntax -- We want to throw if test fails
    throw new Error(
      "Invalid Kompassi login mock service logout response data",
      { cause: result.error },
    );
  }

  res.redirect(result.data.next);
};

import { Request, Response } from "express";
import { z } from "zod";
import {
  KompassiProfile,
  KompassiTokens,
} from "server/features/kompassi-login/KompassiLoginTypes";

const accessToken = "fi9crnvvDdMDjKoetkgXwQZAhj4RFN";
const tokenType = "Bearer";

const KompassiLoginResponseSchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string(),
  redirect_uri: z.string(),
  scope: z.literal("read"),
});

export const getKompassiLoginMockRedirect = (
  req: Request,
  res: Response,
): void => {
  const result = KompassiLoginResponseSchema.safeParse(req.query);
  if (!result.success) {
    // eslint-disable-next-line no-restricted-syntax -- We want to throw if test fails
    throw new Error(
      "Invalid Kompassi login mock service response data",
      result.error,
    );
  }

  const redirectUri = result.data.redirect_uri;
  const code = "S8gxcP4hFeU3Q6Jrpjp8sU8f82qvy7";

  res.redirect(`${redirectUri}?code=${code}`);
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
    throw new Error(
      "Invalid Kompassi login mock service token response data",
      result.error,
    );
  }

  const response: KompassiTokens = {
    access_token: accessToken,
    expires_in: 36000,
    token_type: tokenType,
    scope: "read",
    refresh_token: "fw66oZDSDXDdx4R6UM4cu9mJ27tW49",
  };

  res.json(response);
};

export const getKompassiLoginMockProfile = (
  req: Request,
  res: Response,
): void => {
  if (req.headers.authorization !== `${tokenType} ${accessToken}`) {
    // eslint-disable-next-line no-restricted-syntax -- We want to throw if test fails
    throw new Error("Invalid Kompassi login mock service profile access token");
  }

  const response: KompassiProfile = {
    id: 99,
    first_name: "Firstname",
    surname: "Surname",
    nick: "Nickname",
    full_name: 'Firstname "Nickname" Surname',
    display_name: 'Firstname "Nickname" Surname',
    preferred_name_display_style: "firstname_nick_surname",
    email: "firstname.lastname@example.com",
    birth_date: "2000-01-01",
    phone: "+358 50 1234567",
    username: "nickname",
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
      result.error,
    );
  }

  res.redirect(result.data.next);
};

import { Request, Response } from "express";
import { z } from "zod";
import axios from "axios";
import { AuthEndpoint } from "shared/constants/apiEndpoints";
import { logger } from "server/utils/logger";
import {
  PostKompassiLoginError,
  PostKompassiLoginResponse,
} from "shared/typings/api/login";
import { UserGroup } from "shared/typings/models/user";
import { findUserById, saveUser } from "server/features/user/userRepository";
import { isErrorResult, unwrapResult } from "shared/utils/result";
import { getJWT } from "server/utils/jwt";
import { createSerial } from "server/features/user/userUtils";

const baseUrl = process.env.KOMPASSI_BASE_URL ?? "https://kompassi.eu";
const clientId = process.env.KOMPASSI_CLIENT_ID ?? "";
const clientSecret = process.env.KOMPASSI_CLIENT_SECRET ?? "";

const accessGroups = ["users"];
const adminGroups = ["admin"];

interface Profile {
  id: number;
  first_name: string;
  surname: string;
  full_name: string;
  groups: string[];
  email: string;
  username: string;
}

const getProfile = async (accessToken: string): Promise<Profile> => {
  const url = `${baseUrl}/api/v2/people/me`;

  const headers = { authorization: `Bearer ${accessToken}` };

  const response = await axios.get(url, { headers });
  return response.data;
};

const getAuthUrl = (origin: string): string => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${origin}${AuthEndpoint.KOMPASSI_CALLBACK}`,
    scope: "read",
  });

  return `${baseUrl}/oauth2/authorize?${params.toString()}`;
};

export const sendKompassiLoginRedirect = (
  req: Request<{}, {}, {}>,
  res: Response,
): Response => {
  if (!req.headers.origin) {
    return res.sendStatus(422);
  }

  return res.status(302).json({
    location: getAuthUrl(req.headers.origin),
  });
};

interface Token {
  access_token: string;
  refresh_token: string;
}

const getToken = async (code: string, origin: string): Promise<Token> => {
  const params = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `${origin}${AuthEndpoint.KOMPASSI_CALLBACK}`,
  });
  const body = params.toString();
  const url = `${baseUrl}/oauth2/token`;
  const headers = {
    accept: "application/json",
    "content-type": "application/x-www-form-urlencoded",
  };

  const response = await axios.post(url, body, { headers });
  return response.data;
};

const PostSentryTunnelRequestSchema = z.object({ code: z.string() });

export const doLogin = async (
  req: Request<{}, {}, string>,
  res: Response,
): Promise<Response> => {
  if (!req.headers.origin) {
    return res.sendStatus(422);
  }

  const result = PostSentryTunnelRequestSchema.safeParse(req.body);
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

const parseProfile = async (
  profile: Profile,
): Promise<PostKompassiLoginResponse | PostKompassiLoginError> => {
  const groupNames = profile.groups.filter(
    (groupName) =>
      accessGroups.includes(groupName) || adminGroups.includes(groupName),
  );

  if (groupNames.length === 0) {
    return {
      message: "User not member of any group that would grant access",
      status: "error",
      errorId: "invalidUserGroup",
    };
  }

  const isAdmin = groupNames.some((groupName) =>
    adminGroups.includes(groupName),
  );

  const existingUserResult = await findUserById(profile.id);
  if (isErrorResult(existingUserResult)) {
    return {
      message: "Error finding existing user",
      status: "error",
      errorId: "loginFailed",
    };
  }

  const existingUser = unwrapResult(existingUserResult);

  if (existingUser) {
    return {
      message: "User login success",
      status: "success",
      username: existingUser.username,
      userGroup: existingUser.userGroup,
      serial: existingUser.serial,
      groupCode: existingUser.groupCode,
      jwt: getJWT(existingUser.userGroup, existingUser.username),
      eventLogItems: existingUser.eventLogItems,
    };
  }

  const serialDocResult = await createSerial();
  if (isErrorResult(serialDocResult)) {
    return {
      message: "Error creating serial for new user",
      status: "error",
      errorId: "loginFailed",
    };
  }
  const serialDoc = unwrapResult(serialDocResult);
  const serial = serialDoc[0].serial;

  const saveUserResult = await saveUser({
    userId: profile.id,
    username: profile.username,
    serial,
    passwordHash: "",
    userGroup: isAdmin ? UserGroup.ADMIN : UserGroup.USER,
    groupCode: "0",
  });

  if (isErrorResult(saveUserResult)) {
    return {
      message: "Saving user failed",
      status: "error",
      errorId: "loginFailed",
    };
  }

  const saveUserResponse = unwrapResult(saveUserResult);

  return {
    message: "User login success",
    status: "success",
    username: saveUserResponse.username,
    userGroup: saveUserResponse.userGroup,
    serial: saveUserResponse.serial,
    groupCode: saveUserResponse.groupCode,
    jwt: getJWT(saveUserResponse.userGroup, saveUserResponse.username),
    eventLogItems: saveUserResponse.eventLogItems,
  };
};

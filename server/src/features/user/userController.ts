import { Request, Response } from "express";
import {
  fetchUserByUsername,
  storeUser,
  fetchUserBySerialOrUsername,
  storeUserPassword,
} from "server/features/user/userService";
import { UserGroup } from "shared/types/models/user";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetUserBySerialRequestSchema,
  PostUpdateUserPasswordRequestSchema,
  PostUserRequestSchema,
} from "shared/types/api/users";
import { PostUpdateUserEmailAddressRequestSchema } from "shared/types/api/login";
import { verifyUpdateUserEmailAddress } from "server/features/kompassi-login/kompassiLoginService";

export const postUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.USERS}`);

  const result = PostUserRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(
        `Error validating postUser body: ${JSON.stringify(result.error)}`,
      ),
    );
    return res.sendStatus(422);
  }

  const { username, password, serial } = result.data;
  const response = await storeUser(username, password, serial);
  return res.json(response);
};

export const postUserPassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.USERS_PASSWORD}`);

  const requesterUsername = getAuthorizedUsername(req.headers.authorization, [
    UserGroup.USER,
    UserGroup.HELP,
    UserGroup.ADMIN,
  ]);
  if (!requesterUsername) {
    return res.sendStatus(401);
  }

  const result = PostUpdateUserPasswordRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(
        `Error validating postUserPassword body: ${JSON.stringify(result.error)}`,
      ),
    );
    return res.sendStatus(422);
  }

  const { usernameToUpdate, password } = result.data;

  if (
    requesterUsername !== usernameToUpdate &&
    requesterUsername !== "helper" &&
    requesterUsername !== "admin"
  ) {
    return res.sendStatus(401);
  }

  const response = await storeUserPassword(
    usernameToUpdate,
    password,
    requesterUsername,
  );
  return res.json(response);
};

export const getUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.USERS}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const response = await fetchUserByUsername(username);
  return res.json(response);
};

export const getUserBySerialOrUsername = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME}`);

  const username = getAuthorizedUsername(req.headers.authorization, [
    UserGroup.HELP,
    UserGroup.ADMIN,
  ]);
  if (!username) {
    return res.sendStatus(401);
  }

  const result = GetUserBySerialRequestSchema.safeParse(req.query);
  if (!result.success) {
    logger.error(
      "Error validating getUserBySerialOrUsername params: %s",
      result.error,
    );
    return res.sendStatus(422);
  }

  const { searchTerm } = result.data;

  if (!searchTerm) {
    return res.sendStatus(422);
  }

  const response = await fetchUserBySerialOrUsername(searchTerm);

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
    return res.status(422).json({
      message: "Invalid email format",
      status: "error",
      errorId: "invalidEmail",
    });
  }

  const { email } = result.data;
  const response = await verifyUpdateUserEmailAddress(jwtUsername, email);
  return res.json(response);
};

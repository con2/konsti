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

export const postUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.USERS}`);

  const result = PostUserRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      new Error(`Error validating postUser body: ${result.error}`),
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
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      new Error(`Error validating postUserPassword body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const { userToUpdateUsername, password } = result.data;

  if (
    requesterUsername !== userToUpdateUsername &&
    requesterUsername !== "helper" &&
    requesterUsername !== "admin"
  ) {
    return res.sendStatus(401);
  }

  const response = await storeUserPassword(
    userToUpdateUsername,
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

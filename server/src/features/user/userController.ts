import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  fetchUserByUsername,
  storeUser,
  fetchUserBySerialOrUsername,
  storeUserPassword,
} from "server/features/user/userService";
import { UserGroup } from "shared/typings/models/user";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetUserBySerialRequest,
  GetUserBySerialRequestSchema,
  PostUserRequest,
  PostUpdateUserPasswordRequest,
  PostUpdateUserPasswordRequestSchema,
  PostUserRequestSchema,
} from "shared/typings/api/users";

export const postUser = async (
  req: Request<{}, {}, PostUserRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.USERS}`);

  let body;
  try {
    body = PostUserRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating postUser body: ${error.message}`);
    }
    return res.sendStatus(422);
  }

  const { username, password, serial } = body;

  const response = await storeUser(username, password, serial);
  return res.json(response);
};

export const postUserPassword = async (
  req: Request<{}, {}, PostUpdateUserPasswordRequest>,
  res: Response
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

  let body;
  try {
    body = PostUpdateUserPasswordRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating postUserPassword body: ${error.message}`);
    }
    return res.sendStatus(422);
  }

  const { userToUpdateUsername, password } = body;

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
    requesterUsername
  );
  return res.json(response);
};

export const getUser = async (
  req: Request<{}, {}, {}>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.USERS}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const response = await fetchUserByUsername(username);
  return res.json(response);
};

export const getUserBySerialOrUsername = async (
  req: Request<{}, {}, GetUserBySerialRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME}`);

  const username = getAuthorizedUsername(req.headers.authorization, [
    UserGroup.HELP,
    UserGroup.ADMIN,
  ]);
  if (!username) {
    return res.sendStatus(401);
  }

  let params;
  try {
    params = GetUserBySerialRequestSchema.parse(req.query);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating getUserBySerialOrUsername params: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const { searchTerm } = params;

  if (!searchTerm) {
    return res.sendStatus(422);
  }

  const response = await fetchUserBySerialOrUsername(searchTerm);

  return res.json(response);
};

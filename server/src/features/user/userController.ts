import { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
  fetchUserByUsername,
  storeUser,
  fetchUserBySerialOrUsername,
  storeUserPassword,
} from "server/features/user/userService";
import { UserGroup } from "shared/typings/models/user";
import { isAuthorized } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { UpdateUserPasswordRequest } from "shared/typings/api/login";
import { sharedConfig } from "shared/config/sharedConfig";
import { createSerial } from "./userUtils";
import {
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
  USERNAME_LENGTH_MAX,
  USERNAME_LENGTH_MIN,
} from "shared/constants/validation";
import { PostUserRequest } from "shared/typings/api/users";

export const postUser = async (
  req: Request<{}, {}, PostUserRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.USERS}`);

  const PostUserParameters = z.object({
    username: z
      .string()
      .trim()
      .min(USERNAME_LENGTH_MIN)
      .max(USERNAME_LENGTH_MAX),
    password: z
      .string()
      .trim()
      .min(PASSWORD_LENGTH_MIN)
      .max(PASSWORD_LENGTH_MAX),
    serial: z
      .string()
      .optional()
      .refine((input) => {
        if (sharedConfig.requireRegistrationCode) {
          if (input?.trim().length === 0) {
            return false;
          }
        }
        return true;
      }),
  });

  let parameters;
  try {
    parameters = PostUserParameters.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating postUser parameters: ${error.message}`);
    }
    return res.sendStatus(422);
  }

  const { username, password } = parameters;
  let serial;
  if (!sharedConfig.requireRegistrationCode) {
    const serialDoc = await createSerial();
    serial = serialDoc[0].serial;
  } else {
    serial = parameters.serial;
  }
  const response = await storeUser(username, password, serial);
  return res.json(response);
};

export const postUserPassword = async (
  req: Request<{}, {}, UpdateUserPasswordRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.USERS_PASSWORD}`);

  const PostUserPasswordParameters = z.object({
    username: z.string(),
    password: z.string(),
    requester: z.string(),
  });

  let parameters;
  try {
    parameters = PostUserPasswordParameters.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating postUserPassword parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const { username, password, requester } = parameters;

  if (requester === "helper") {
    if (!isAuthorized(req.headers.authorization, UserGroup.HELP, requester)) {
      return res.sendStatus(401);
    }
  } else if (requester === "admin") {
    if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, requester)) {
      return res.sendStatus(401);
    }
  } else {
    if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
      return res.sendStatus(401);
    }
  }

  const response = await storeUserPassword(username, password, requester);
  return res.json(response);
};

export const getUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.USERS}`);

  const GetUserQueryParameters = z.object({
    username: z.string(),
  });

  let parameters;
  try {
    parameters = GetUserQueryParameters.parse(req.query);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating getUser parameters: ${error.message}`);
    }

    return res.sendStatus(422);
  }

  const { username } = parameters;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  if (!username) {
    return res.sendStatus(422);
  }

  const response = await fetchUserByUsername(username);
  return res.json(response);
};

export const getUserBySerialOrUsername = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME}`);

  const helperAuth = isAuthorized(
    req.headers.authorization,
    UserGroup.HELP,
    "helper"
  );

  const adminAuth = isAuthorized(
    req.headers.authorization,
    UserGroup.ADMIN,
    "admin"
  );

  if (!helperAuth && !adminAuth) {
    return res.sendStatus(401);
  }

  const GetUserQueryParameters = z.object({
    searchTerm: z.string(),
  });

  let parameters;
  try {
    parameters = GetUserQueryParameters.parse(req.query);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating getUserBySerialOrUsername parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const { searchTerm } = parameters;

  if (!searchTerm) {
    return res.sendStatus(422);
  }

  const response = await fetchUserBySerialOrUsername(searchTerm);

  return res.json(response);
};

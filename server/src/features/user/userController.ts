import { Request, Response } from "express";
import { validationResult } from "express-validator";
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
import {
  RegistrationFormFields,
  UpdateUserPasswordRequest,
} from "shared/typings/api/login";
import { sharedConfig } from "shared/config/sharedConfig";
import { ConventionType } from "shared/config/sharedConfig.types";
import { createSerial } from "./userUtils";

export const postUser = async (
  req: Request<{}, {}, RegistrationFormFields>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.USERS}`);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(422);
  }

  const { username, password } = req.body;
  let serial;
  if (sharedConfig.conventionType === ConventionType.REMOTE) {
    const serialDoc = await createSerial();
    serial = serialDoc[0].serial;
  } else {
    serial = req.body.serial;
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

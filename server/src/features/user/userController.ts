import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { z, ZodError } from "zod";
import {
  fetchUserByUsername,
  storeUser,
  storeFavorite,
  fetchGroup,
  storeGroup,
  login,
  storeSignup,
  fetchUserBySerialOrUsername,
  storeUserPassword,
} from "server/features/user/userService";
import { UserGroup } from "shared/typings/models/user";
import { isAuthorized } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import {
  FAVORITE_ENDPOINT,
  GROUP_ENDPOINT,
  LOGIN_ENDPOINT,
  SIGNUP_ENDPOINT,
  USERS_BY_SERIAL_OR_USERNAME_ENDPOINT,
  USERS_ENDPOINT,
  USERS_PASSWORD_ENDPOINT,
} from "shared/constants/apiEndpoints";
import { SignupData } from "shared/typings/api/signup";
import { GroupData } from "shared/typings/api/groups";
import { SaveFavoriteRequest } from "shared/typings/api/favorite";
import {
  LoginFormFields,
  RegistrationFormFields,
  UpdateUserPasswordRequest,
} from "shared/typings/api/login";
import { sharedConfig } from "shared/config/sharedConfig";
import { ConventionType } from "shared/config/sharedConfig.types";
import { createSerial } from "./userUtils";
import { GameSchema } from "shared/typings/models/game";

export const postUser = async (
  req: Request<{}, {}, RegistrationFormFields>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${USERS_ENDPOINT}`);

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
  logger.info(`API call: POST ${USERS_PASSWORD_ENDPOINT}`);

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
        `Error validating postFavorite parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const { username, password, requester } = parameters;

  if (requester === "ropetiski") {
    if (!isAuthorized(req.headers.authorization, UserGroup.HELP, requester)) {
      return res.sendStatus(401);
    }
  } else {
    if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
      return res.sendStatus(401);
    }
  }

  const response = await storeUserPassword(username, password);
  return res.json(response);
};

export const postLogin = async (
  req: Request<{}, {}, LoginFormFields>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${LOGIN_ENDPOINT}`);

  const { username, password } = req.body;

  if (!username || !password) {
    return res.sendStatus(422);
  }

  const response = await login(username, password);
  return res.json(response);
};

export const postFavorite = async (
  req: Request<{}, {}, { favoriteData: SaveFavoriteRequest }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${FAVORITE_ENDPOINT}`);

  const PostFavoriteParameters = z.object({
    favoriteData: z.object({
      username: z.string(),
      favoritedGames: z.array(z.string()),
    }),
  });

  let parameters;
  try {
    parameters = PostFavoriteParameters.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating postFavorite parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const { favoriteData } = parameters;

  if (
    !isAuthorized(
      req.headers.authorization,
      UserGroup.USER,
      favoriteData.username
    )
  ) {
    return res.sendStatus(401);
  }

  const response = await storeFavorite(favoriteData);
  return res.json(response);
};

export const postGroup = async (
  req: Request<{}, {}, { groupData: GroupData }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${GROUP_ENDPOINT}`);

  const PostGroupParameters = z.object({
    groupData: z.object({
      groupCode: z.string(),
      leader: z.boolean(),
      ownSerial: z.string(),
      username: z.string(),
      leaveGroup: z.optional(z.boolean()),
      closeGroup: z.optional(z.boolean()),
    }),
  });

  let parameters;
  try {
    parameters = PostGroupParameters.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating getUser parameters: ${error.message}`);
    }
    return res.sendStatus(422);
  }

  const { username, leader, groupCode, ownSerial, leaveGroup, closeGroup } =
    parameters.groupData;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  const response = await storeGroup(
    username,
    leader,
    groupCode,
    ownSerial,
    leaveGroup,
    closeGroup
  );
  return res.json(response);
};

export const getUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${USERS_ENDPOINT}`);

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
  logger.info(`API call: GET ${USERS_BY_SERIAL_OR_USERNAME_ENDPOINT}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.HELP, "ropetiski")) {
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

export const getGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${GROUP_ENDPOINT}`);

  const GetGroupQueryParameters = z.object({
    groupCode: z.string(),
    username: z.string(),
  });

  let parameters;

  try {
    parameters = GetGroupQueryParameters.parse(req.query);
  } catch (error) {
    return res.sendStatus(422);
  }

  const { groupCode, username } = parameters;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  const response = await fetchGroup(groupCode);
  return res.json(response);
};

export const postSignup = async (
  req: Request<{}, {}, { signupData: SignupData }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${SIGNUP_ENDPOINT}`);

  const PostSignupParameters = z.object({
    signupData: z.object({
      username: z.string(),
      selectedGames: z.array(
        z.object({
          gameDetails: GameSchema,
          priority: z.number(),
          time: z.string(),
          message: z.string(),
        })
      ),
      signupTime: z.string(),
    }),
  });

  let parameters;
  try {
    parameters = PostSignupParameters.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating getUser parameters: ${error.message}`);
    }
    return res.sendStatus(422);
  }

  const { selectedGames, username, signupTime } = parameters.signupData;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  const response = await storeSignup(selectedGames, username, signupTime);
  return res.json(response);
};

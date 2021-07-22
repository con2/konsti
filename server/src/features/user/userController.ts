import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { String, Record, Number, Array, Boolean } from 'runtypes';
import {
  fetchUserByUsername,
  storeUser,
  storeFavorite,
  fetchGroup,
  storeGroup,
  login,
  storeSignup,
  fetchUserBySerialOrUsername,
} from 'server/features/user/userService';
import { UserGroup } from 'shared/typings/models/user';
import { isAuthorized } from 'server/utils/authHeader';
import { logger } from 'server/utils/logger';
import {
  FAVORITE_ENDPOINT,
  GROUP_ENDPOINT,
  LOGIN_ENDPOINT,
  SIGNUP_ENDPOINT,
  USERS_BY_SERIAL_ENDPOINT,
  USERS_ENDPOINT,
} from 'shared/constants/apiEndpoints';
import { SignupData } from 'shared/typings/api/signup';
import { GroupData } from 'shared/typings/api/groups';
import { SaveFavoriteRequest } from 'shared/typings/api/favorite';
import {
  LoginFormFields,
  RegistrationFormFields,
} from 'shared/typings/api/login';
import { sharedConfig } from 'shared/config/sharedConfig';
import { ConventionType } from 'shared/config/sharedConfig.types';
import { createSerial } from './userUtils';
import { GameRuntype } from 'shared/typings/models/game';

export const postUser = async (
  req: Request<{}, {}, RegistrationFormFields>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${USERS_ENDPOINT}`);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(422);
  }

  // @ts-expect-error: TODO
  const { username, password, changePassword } = req.body;
  let serial;
  if (sharedConfig.conventionType === ConventionType.REMOTE) {
    const serialDoc = await createSerial();
    serial = serialDoc[0].serial;
  } else {
    serial = req.body.serial;
  }
  const response = await storeUser(username, password, serial, changePassword);
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

  const PostFavoriteParameters = Record({
    favoriteData: Record({
      username: String,
      favoritedGames: Array(GameRuntype),
    }),
  });

  let parameters;
  try {
    parameters = PostFavoriteParameters.check(req.body);
  } catch (error) {
    logger.error(`Error validating postFavorite parameters: ${error.message}`);
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

  const PostGroupParameters = Record({
    groupData: Record({
      groupCode: String,
      leader: Boolean,
      ownSerial: String,
      username: String,
      leaveGroup: Boolean.optional(),
      closeGroup: Boolean.optional(),
    }),
  });

  let parameters;
  try {
    parameters = PostGroupParameters.check(req.body);
  } catch (error) {
    logger.error(`Error validating getUser parameters: ${error.message}`);
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

  const GetUserQueryParameters = Record({
    username: String,
  });

  let parameters;
  try {
    parameters = GetUserQueryParameters.check(req.query);
  } catch (error) {
    logger.error(`Error validating getUser parameters: ${error.message}`);
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
  logger.info(`API call: GET ${USERS_BY_SERIAL_ENDPOINT}`);

  // TODO: Add isAuthorized() with helper token

  const GetUserQueryParameters = Record({
    serial: String,
  });

  let parameters;
  try {
    parameters = GetUserQueryParameters.check(req.query);
  } catch (error) {
    logger.error(
      `Error validating getUserBySerial parameters: ${error.message}`
    );
    return res.sendStatus(422);
  }

  const { serial } = parameters;

  if (!serial) {
    return res.sendStatus(422);
  }

  const response = await fetchUserBySerialOrUsername(serial);

  return res.json(response);
};

export const getGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${GROUP_ENDPOINT}`);

  const GetGroupQueryParameters = Record({
    groupCode: String,
    username: String,
  });

  let parameters;

  try {
    parameters = GetGroupQueryParameters.check(req.query);
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

  const PostSignupParameters = Record({
    signupData: Record({
      username: String,
      selectedGames: Array(
        Record({
          gameDetails: GameRuntype,
          priority: Number,
          time: String,
          message: String,
        })
      ),
      signupTime: String,
    }),
  });

  let parameters;
  try {
    parameters = PostSignupParameters.check(req.body);
  } catch (error) {
    logger.error(`Error validating getUser parameters: ${error.message}`);
    return res.sendStatus(422);
  }

  const { selectedGames, username, signupTime } = parameters.signupData;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  const response = await storeSignup(selectedGames, username, signupTime);
  return res.json(response);
};

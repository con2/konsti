import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { String, Record } from 'runtypes';
import {
  fetchUserByUsername,
  fetchUserBySerial,
  storeUser,
  storeFavorite,
  fetchGroup,
  storeGroup,
  login,
} from 'server/features/user/userService';
import { UserGroup } from 'server/typings/user.typings';
import { validateAuthHeader } from 'server/utils/authHeader';
import { logger } from 'server/utils/logger';
import {
  FAVORITE_ENDPOINT,
  GROUP_ENDPOINT,
  LOGIN_ENDPOINT,
  USERS_BY_SERIAL_ENDPOINT,
  USERS_ENDPOINT,
} from 'shared/constants/apiEndpoints';

export const postUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${USERS_ENDPOINT}`);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { username, password, serial, changePassword } = req.body;

  const response = await storeUser(username, password, serial, changePassword);
  return res.send(response);
};

export const postLogin = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${LOGIN_ENDPOINT}`);

  const { username, password, jwt } = req.body;

  if (((!username || !password) && !jwt) || (username && password && jwt)) {
    return res.sendStatus(422);
  }

  const response = await login(username, password, jwt);
  return res.send(response);
};

export const postFavorite = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${FAVORITE_ENDPOINT}`);

  const favoriteData = req.body.favoriteData;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await storeFavorite(favoriteData);
  return res.send(response);
};

export const postGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${GROUP_ENDPOINT}`);

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const groupData = req.body.groupData;
  const {
    username,
    leader,
    groupCode,
    ownSerial,
    leaveGroup,
    closeGroup,
  } = groupData;

  const response = await storeGroup(
    username,
    leader,
    groupCode,
    ownSerial,
    leaveGroup,
    closeGroup
  );
  return res.send(response);
};

export const getUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${USERS_ENDPOINT}`);

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const GetUserQueryParameters = Record({
    username: String,
  });

  let queryParameters;
  try {
    queryParameters = GetUserQueryParameters.check(req.query);
  } catch (error) {
    logger.error(`Error validating getUser parameters: ${error.message}`);
    return res.sendStatus(422);
  }

  const { username } = queryParameters;

  if (!username) {
    return res.sendStatus(422);
  }

  const response = await fetchUserByUsername(username);
  return res.send(response);
};

export const getUserBySerial = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${USERS_BY_SERIAL_ENDPOINT}`);

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const GetUserQueryParameters = Record({
    serial: String,
  });

  let queryParameters;
  try {
    queryParameters = GetUserQueryParameters.check(req.query);
  } catch (error) {
    logger.error(
      `Error validating getUserBySerial parameters: ${error.message}`
    );
    return res.sendStatus(422);
  }

  const { serial } = queryParameters;

  if (!serial) {
    return res.sendStatus(422);
  }

  const response = await fetchUserBySerial(serial);
  return res.send(response);
};

export const getGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${GROUP_ENDPOINT}`);

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const GetGroupQueryParameters = Record({
    groupCode: String,
  });

  let queryParameters;

  try {
    queryParameters = GetGroupQueryParameters.check(req.query);
  } catch (error) {
    return res.sendStatus(422);
  }

  const { groupCode } = queryParameters;

  const response = await fetchGroup(groupCode);
  return res.send(response);
};

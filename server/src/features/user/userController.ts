import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Undefined, String, Record } from 'runtypes';
import { storeFavorite } from 'server/features/user/favoriteService';
import { fetchGroup, storeGroup } from 'server/features/user/groupService';
import { login } from 'server/features/user/loginService';
import { storeSignup } from 'server/features/user/signupService';
import { fetchUser, storeUser } from 'server/features/user/userService';
import { UserGroup } from 'server/typings/user.typings';
import { validateAuthHeader } from 'server/utils/authHeader';
import { logger } from 'server/utils/logger';

export const postUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info('API call: POST /api/user');

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
  logger.info('API call: POST /api/login');

  const { username, password, jwt } = req.body;

  if (((!username || !password) && !jwt) || (username && password && jwt)) {
    return res.sendStatus(422);
  }

  const response = await login(username, password, jwt);
  return res.send(response);
};

export const postSignup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info('API call: POST /api/signup');

  const signupData = req.body.signupData;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const { selectedGames, username, signupTime } = signupData;

  const response = await storeSignup(selectedGames, username, signupTime);
  return res.send(response);
};

export const postFavorite = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info('API call: POST /api/favorite');

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
  logger.info('API call: POST /api/group');

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
  logger.info('API call: GET /api/user');

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const GetUserQueryParameters = Record({
    username: String.Or(Undefined),
    serial: String.Or(Undefined),
  });

  const queryParameters = GetUserQueryParameters.check(req.query);

  const { username, serial } = queryParameters;

  if (!username && !serial) {
    return res.sendStatus(422);
  }

  const response = await fetchUser(username, serial);
  return res.send(response);
};

export const getGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info('API call: GET /api/group');

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

import express, { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Record, String, Undefined } from 'runtypes';
import { postUserValidation, postLoginValidation } from 'server/api/validation';
import { postGames, getGames } from 'server/api/controllers/gamesController';
import { postUser, getUser } from 'server/api/controllers/userController';
import { postLogin } from 'server/api/controllers/loginController';
import { postAssignment } from 'server/api/controllers/assignmentController';
import { postSignup } from 'server/api/controllers/signupController';
import { postFavorite } from 'server/api/controllers/favoriteController';
import { postHidden } from 'server/api/controllers/hiddenController';
import { postSignupTime } from 'server/api/controllers/signuptimeController';
import { postFeedback } from 'server/api/controllers/feedbackController';
import { getSettings } from 'server/api/controllers/settingsController';
import { getResults } from 'server/api/controllers/resultsController';
import { postGroup, getGroup } from 'server/api/controllers/groupController';
import { toggleAppOpen } from 'server/api/controllers/toggleAppOpenController';
import { validateAuthHeader } from 'server/utils/authHeader';
import { UserGroup } from 'server/typings/user.typings';

export const apiRoutes = express.Router();

/* eslint-disable @typescript-eslint/no-misused-promises */

/* POST routes */

apiRoutes.post('/games', async (req: Request, res: Response) => {
  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await postGames();
  return res.send(response);
});

apiRoutes.post(
  '/user',
  postUserValidation,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { username, password, serial, changePassword } = req.body;

    const response = await postUser(username, password, serial, changePassword);
    return res.send(response);
  }
);

apiRoutes.post(
  '/login',
  postLoginValidation,
  async (req: Request, res: Response) => {
    const { username, password, jwt } = req.body;

    if (((!username || !password) && !jwt) || (username && password && jwt)) {
      return res.sendStatus(422);
    }

    const response = await postLogin(username, password, jwt);
    return res.send(response);
  }
);

apiRoutes.post('/assignment', async (req: Request, res: Response) => {
  const startingTime = req.body.startingTime;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await postAssignment(startingTime);
  return res.send(response);
});

apiRoutes.post('/signup', async (req: Request, res: Response) => {
  const signupData = req.body.signupData;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const { selectedGames, username, signupTime } = signupData;

  const response = await postSignup(selectedGames, username, signupTime);
  return res.send(response);
});

apiRoutes.post('/favorite', async (req: Request, res: Response) => {
  const favoriteData = req.body.favoriteData;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await postFavorite(favoriteData);
  return res.send(response);
});

apiRoutes.post('/hidden', async (req: Request, res: Response) => {
  const hiddenData = req.body.hiddenData;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await postHidden(hiddenData);
  return res.send(response);
});

apiRoutes.post('/signuptime', async (req: Request, res: Response) => {
  const signupTime = req.body.signupTime;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await postSignupTime(signupTime);
  return res.send(response);
});

apiRoutes.post('/feedback', async (req: Request, res: Response) => {
  const feedbackData = req.body.feedbackData;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await postFeedback(feedbackData);
  return res.send(response);
});

apiRoutes.post('/group', async (req: Request, res: Response) => {
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

  const response = await postGroup(
    username,
    leader,
    groupCode,
    ownSerial,
    leaveGroup,
    closeGroup
  );
  return res.send(response);
});

apiRoutes.post('/toggle-app-open', async (req: Request, res: Response) => {
  const appOpen = req.body.appOpen;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await toggleAppOpen(appOpen);
  return res.send(response);
});

/* GET routes */

apiRoutes.get('/games', async (_req: Request, res: Response) => {
  const response = await getGames();
  return res.send(response);
});

apiRoutes.get('/user', async (req: Request, res: Response) => {
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

  const response = await getUser(username, serial);
  return res.send(response);
});

apiRoutes.get('/settings', async (_req: Request, res: Response) => {
  const response = await getSettings();
  return res.send(response);
});

apiRoutes.get('/results', async (req: Request, res: Response) => {
  const GetResultsQueryParameters = Record({
    startTime: String,
  });

  let queryParameters;
  try {
    queryParameters = GetResultsQueryParameters.check(req.query);
  } catch (error) {
    return res.sendStatus(422);
  }

  const { startTime } = queryParameters;

  if (!startTime) {
    return res.sendStatus(422);
  }

  const response = await getResults(startTime);
  return res.send(response);
});

apiRoutes.get('/group', async (req: Request, res: Response) => {
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

  const response = await getGroup(groupCode);
  return res.send(response);
});

/* eslint-enable @typescript-eslint/no-misused-promises */

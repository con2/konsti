import express from 'express';
import { postUserValidation, postLoginValidation } from 'server/api/validation';
import { postFeedback } from 'server/features/feedback/feedbackController';
import { getGames, postGame } from 'server/features/game/gameController';
import {
  getResults,
  postAssignment,
} from 'server/features/results/resultsController';
import {
  getSettings,
  postAppOpen,
  postHidden,
  postSignupTime,
} from 'server/features/settings/settingsController';
import {
  getGroup,
  getUser,
  postFavorite,
  postGroup,
  postLogin,
  postSignup,
  postUser,
} from 'server/features/user/userController';

export const apiRoutes = express.Router();

/* eslint-disable @typescript-eslint/no-misused-promises */

/* POST routes */

apiRoutes.post('/games', postGame);
apiRoutes.post('/user', postUserValidation, postUser);
apiRoutes.post('/login', postLoginValidation, postLogin);
apiRoutes.post('/assignment', postAssignment);
apiRoutes.post('/signup', postSignup);
apiRoutes.post('/favorite', postFavorite);
apiRoutes.post('/hidden', postHidden);
apiRoutes.post('/signuptime', postSignupTime);
apiRoutes.post('/feedback', postFeedback);
apiRoutes.post('/group', postGroup);
apiRoutes.post('/toggle-app-open', postAppOpen);

/* GET routes */

apiRoutes.get('/games', getGames);
apiRoutes.get('/user', getUser);
apiRoutes.get('/settings', getSettings);
apiRoutes.get('/results', getResults);
apiRoutes.get('/group', getGroup);

/* eslint-enable @typescript-eslint/no-misused-promises */

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
  getUserBySerial,
  postFavorite,
  postGroup,
  postLogin,
  postUser,
  postSignup,
  postEnteredGame,
  deleteEnteredGame,
} from 'server/features/user/userController';
import {
  ASSIGNMENT_ENDPOINT,
  ENTERED_GAME_ENDPOINT,
  FAVORITE_ENDPOINT,
  FEEDBACK_ENDPOINT,
  GAMES_ENDPOINT,
  GROUP_ENDPOINT,
  HIDDEN_ENDPOINT,
  LOGIN_ENDPOINT,
  RESULTS_ENDPOINT,
  SETTINGS_ENDPOINT,
  SIGNUPTIME_ENDPOINT,
  SIGNUP_ENDPOINT,
  TOGGLE_APP_OPEN_ENDPOINT,
  USERS_BY_SERIAL_ENDPOINT,
  USERS_ENDPOINT,
} from 'shared/constants/apiEndpoints';

export const apiRoutes = express.Router();

/* eslint-disable @typescript-eslint/no-misused-promises */

/* POST routes */

apiRoutes.post(GAMES_ENDPOINT, postGame);
apiRoutes.post(USERS_ENDPOINT, postUserValidation(), postUser);
apiRoutes.post(LOGIN_ENDPOINT, postLoginValidation, postLogin);
apiRoutes.post(ASSIGNMENT_ENDPOINT, postAssignment);
apiRoutes.post(SIGNUP_ENDPOINT, postSignup);
apiRoutes.post(FAVORITE_ENDPOINT, postFavorite);
apiRoutes.post(HIDDEN_ENDPOINT, postHidden);
apiRoutes.post(SIGNUPTIME_ENDPOINT, postSignupTime);
apiRoutes.post(FEEDBACK_ENDPOINT, postFeedback);
apiRoutes.post(GROUP_ENDPOINT, postGroup);
apiRoutes.post(TOGGLE_APP_OPEN_ENDPOINT, postAppOpen);
apiRoutes.post(ENTERED_GAME_ENDPOINT, postEnteredGame);

/* GET routes */

apiRoutes.get(GAMES_ENDPOINT, getGames);
apiRoutes.get(USERS_ENDPOINT, getUser);
apiRoutes.get(USERS_BY_SERIAL_ENDPOINT, getUserBySerial);
apiRoutes.get(SETTINGS_ENDPOINT, getSettings);
apiRoutes.get(RESULTS_ENDPOINT, getResults);
apiRoutes.get(GROUP_ENDPOINT, getGroup);

/* DELETE routes */

apiRoutes.delete(ENTERED_GAME_ENDPOINT, deleteEnteredGame);

/* eslint-enable @typescript-eslint/no-misused-promises */

import express from "express";
import { postUserValidation, postLoginValidation } from "server/api/validation";
import { postFeedback } from "server/features/feedback/feedbackController";
import { getGames, postGame } from "server/features/game/gameController";
import {
  getResults,
  postAssignment,
} from "server/features/results/resultsController";
import {
  deleteSignupMessage,
  getSettings,
  postHidden,
  postSettings,
  postSignupMessage,
  postSignupTime,
} from "server/features/settings/settingsController";
import {
  deleteEnteredGame,
  postEnteredGame,
} from "server/features/user/entered-game/enteredGameController";
import { postSessionRestore } from "server/features/user/session-restore/sessionRestoreController";
import {
  getGroup,
  getUser,
  postFavorite,
  postGroup,
  postLogin,
  postUser,
  postSignup,
  getUserBySerialOrUsername,
  postUserPassword,
} from "server/features/user/userController";
import {
  getTestSettings,
  postTestSettings,
} from "server/test/test-settings/testSettingsController";
import {
  ASSIGNMENT_ENDPOINT,
  ENTERED_GAME_ENDPOINT,
  FAVORITE_ENDPOINT,
  FEEDBACK_ENDPOINT,
  GAMES_ENDPOINT,
  GROUP_ENDPOINT,
  HIDDEN_ENDPOINT,
  LOGIN_ENDPOINT,
  SESSION_RESTORE_ENDPOINT,
  RESULTS_ENDPOINT,
  SETTINGS_ENDPOINT,
  SIGNUPTIME_ENDPOINT,
  SIGNUP_ENDPOINT,
  SIGNUP_MESSAGE_ENDPOINT,
  USERS_ENDPOINT,
  USERS_BY_SERIAL_OR_USERNAME_ENDPOINT,
  USERS_PASSWORD_ENDPOINT,
  TEST_SETTINGS_ENDPOINT,
} from "shared/constants/apiEndpoints";

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
apiRoutes.post(ENTERED_GAME_ENDPOINT, postEnteredGame);
apiRoutes.post(SIGNUP_MESSAGE_ENDPOINT, postSignupMessage);
apiRoutes.post(SESSION_RESTORE_ENDPOINT, postSessionRestore);
apiRoutes.post(USERS_PASSWORD_ENDPOINT, postUserPassword);
apiRoutes.post(SETTINGS_ENDPOINT, postSettings);

/* GET routes */

apiRoutes.get(GAMES_ENDPOINT, getGames);
apiRoutes.get(USERS_ENDPOINT, getUser);
apiRoutes.get(USERS_BY_SERIAL_OR_USERNAME_ENDPOINT, getUserBySerialOrUsername);
apiRoutes.get(SETTINGS_ENDPOINT, getSettings);
apiRoutes.get(RESULTS_ENDPOINT, getResults);
apiRoutes.get(GROUP_ENDPOINT, getGroup);

/* DELETE routes */

apiRoutes.delete(ENTERED_GAME_ENDPOINT, deleteEnteredGame);
apiRoutes.delete(SIGNUP_MESSAGE_ENDPOINT, deleteSignupMessage);

/* DEV routes */

if (process.env.SETTINGS !== "production") {
  apiRoutes.post(TEST_SETTINGS_ENDPOINT, postTestSettings);
  apiRoutes.get(TEST_SETTINGS_ENDPOINT, getTestSettings);
}

/* eslint-enable @typescript-eslint/no-misused-promises */

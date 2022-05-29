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
} from "server/features/settings/settingsController";
import {
  deleteEnteredGame,
  postEnteredGame,
} from "server/features/user/entered-game/enteredGameController";
import { postFavorite } from "server/features/user/favorite-game/favoriteGameController";
import {
  getGroup,
  postGroup,
} from "server/features/user/group/groupController";
import { postLogin } from "server/features/user/login/loginController";
import { postSessionRestore } from "server/features/user/session-restore/sessionRestoreController";
import { postSignedGames } from "server/features/user/signed-game/signedGameController";
import {
  getUser,
  postUser,
  getUserBySerialOrUsername,
  postUserPassword,
} from "server/features/user/userController";
import { postPopulateDb } from "server/test/test-data-generation/testDataController";
import {
  getTestSettings,
  postTestSettings,
} from "server/test/test-settings/testSettingsController";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const apiRoutes = express.Router();

/* eslint-disable @typescript-eslint/no-misused-promises */

/* POST routes */

apiRoutes.post(ApiEndpoint.GAMES, postGame);
apiRoutes.post(ApiEndpoint.USERS, postUserValidation(), postUser);
apiRoutes.post(ApiEndpoint.LOGIN, postLoginValidation, postLogin);
apiRoutes.post(ApiEndpoint.ASSIGNMENT, postAssignment);
apiRoutes.post(ApiEndpoint.SIGNED_GAME, postSignedGames);
apiRoutes.post(ApiEndpoint.FAVORITE, postFavorite);
apiRoutes.post(ApiEndpoint.HIDDEN, postHidden);
apiRoutes.post(ApiEndpoint.FEEDBACK, postFeedback);
apiRoutes.post(ApiEndpoint.GROUP, postGroup);
apiRoutes.post(ApiEndpoint.ENTERED_GAME, postEnteredGame);
apiRoutes.post(ApiEndpoint.SIGNUP_MESSAGE, postSignupMessage);
apiRoutes.post(ApiEndpoint.SESSION_RESTORE, postSessionRestore);
apiRoutes.post(ApiEndpoint.USERS_PASSWORD, postUserPassword);
apiRoutes.post(ApiEndpoint.SETTINGS, postSettings);

/* GET routes */

apiRoutes.get(ApiEndpoint.GAMES, getGames);
apiRoutes.get(ApiEndpoint.USERS, getUser);
apiRoutes.get(
  ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME,
  getUserBySerialOrUsername
);
apiRoutes.get(ApiEndpoint.SETTINGS, getSettings);
apiRoutes.get(ApiEndpoint.RESULTS, getResults);
apiRoutes.get(ApiEndpoint.GROUP, getGroup);

/* DELETE routes */

apiRoutes.delete(ApiEndpoint.ENTERED_GAME, deleteEnteredGame);
apiRoutes.delete(ApiEndpoint.SIGNUP_MESSAGE, deleteSignupMessage);

/* DEV routes */

if (process.env.SETTINGS !== "production") {
  apiRoutes.post(ApiEndpoint.TEST_SETTINGS, postTestSettings);
  apiRoutes.get(ApiEndpoint.TEST_SETTINGS, getTestSettings);
  apiRoutes.post(ApiEndpoint.POPULATE_DB, postPopulateDb);
}

/* eslint-enable @typescript-eslint/no-misused-promises */

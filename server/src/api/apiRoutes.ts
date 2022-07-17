import express from "express";
import { postUserValidation, postLoginValidation } from "server/api/validation";
import { postFeedback } from "server/features/feedback/feedbackController";
import { getGames, postUpdateGames } from "server/features/game/gameController";
import {
  getResults,
  postAssignment,
} from "server/features/results/resultsController";
import { postSentryTunnel } from "server/features/sentry-tunnel/sentryTunnelController";
import {
  deleteSignupQuestion,
  getSettings,
  postHidden,
  postSettings,
  postSignupQuestion,
} from "server/features/settings/settingsController";
import {
  deleteSignup,
  postSignup,
} from "server/features/signup/signupController";
import { postFavorite } from "server/features/user/favorite-game/favoriteGameController";
import {
  getGroup,
  postCloseGroup,
  postGroup,
  postJoinGroup,
  postLeaveGroup,
} from "server/features/user/group/groupController";
import { postLogin } from "server/features/user/login/loginController";
import { postSessionRestore } from "server/features/user/session-restore/sessionRestoreController";
import { postSignedGames } from "server/features/user/signed-game/signedGameController";
import { getSignupMessages } from "server/features/user/signup-message/signupMessageController";
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

apiRoutes.post(ApiEndpoint.GAMES, postUpdateGames);
apiRoutes.post(ApiEndpoint.USERS, postUserValidation(), postUser);
apiRoutes.post(ApiEndpoint.LOGIN, postLoginValidation, postLogin);
apiRoutes.post(ApiEndpoint.ASSIGNMENT, postAssignment);
apiRoutes.post(ApiEndpoint.SIGNED_GAME, postSignedGames);
apiRoutes.post(ApiEndpoint.FAVORITE, postFavorite);
apiRoutes.post(ApiEndpoint.HIDDEN, postHidden);
apiRoutes.post(ApiEndpoint.FEEDBACK, postFeedback);
apiRoutes.post(ApiEndpoint.GROUP, postGroup);
apiRoutes.post(ApiEndpoint.JOIN_GROUP, postJoinGroup);
apiRoutes.post(ApiEndpoint.LEAVE_GROUP, postLeaveGroup);
apiRoutes.post(ApiEndpoint.CLOSE_GROUP, postCloseGroup);
apiRoutes.post(ApiEndpoint.SIGNUP_QUESTION, postSignupQuestion);
apiRoutes.post(ApiEndpoint.SESSION_RESTORE, postSessionRestore);
apiRoutes.post(ApiEndpoint.USERS_PASSWORD, postUserPassword);
apiRoutes.post(ApiEndpoint.SETTINGS, postSettings);
apiRoutes.post(ApiEndpoint.SIGNUP, postSignup);
apiRoutes.post(ApiEndpoint.SENTRY_TUNNEL, postSentryTunnel);

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
apiRoutes.get(ApiEndpoint.SIGNUP_MESSAGE, getSignupMessages);

/* DELETE routes */

apiRoutes.delete(ApiEndpoint.SIGNUP_QUESTION, deleteSignupQuestion);
apiRoutes.delete(ApiEndpoint.SIGNUP, deleteSignup);

/* DEV routes */

if (process.env.SETTINGS !== "production") {
  apiRoutes.post(ApiEndpoint.TEST_SETTINGS, postTestSettings);
  apiRoutes.get(ApiEndpoint.TEST_SETTINGS, getTestSettings);
  apiRoutes.post(ApiEndpoint.POPULATE_DB, postPopulateDb);
}

/* eslint-enable @typescript-eslint/no-misused-promises */

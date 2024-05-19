import express from "express";
import {
  postKompassiLoginCallback,
  postKompassiLoginRedirect,
  postKompassiLogoutRedirect,
  postVerifyKompassiLogin,
} from "server/features/kompassi-login/kompassiLoginController";
import { postFeedback } from "server/features/feedback/feedbackController";
import {
  getProgramItems,
  postAutoUpdateProgramItems,
  postUpdateProgramItems,
} from "server/features/program-item/programItemController";
import { getHealthStatus } from "server/features/health/healthController";
import {
  getResults,
  postAssignment,
  postAutoAssignment,
} from "server/features/results/resultsController";
import {
  getSentryTest,
  postSentryTunnel,
} from "server/features/sentry-tunnel/sentryTunnelController";
import {
  deleteSignupQuestion,
  getSettings,
  postHidden,
  postSettings,
  postSignupQuestion,
} from "server/features/settings/settingsController";
import {
  deleteDirectSignup,
  postDirectSignup,
} from "server/features/direct-signup/directSignupController";
import { postEventLogItem } from "server/features/user/event-log/eventLogController";
import { postFavorite } from "server/features/user/favorite-program-item/favoriteProgramItemController";
import {
  getGroup,
  postCloseGroup,
  postCreateGroup,
  postJoinGroup,
  postLeaveGroup,
} from "server/features/user/group/groupController";
import { postLogin } from "server/features/user/login/loginController";
import { postSessionRestore } from "server/features/user/session-restore/sessionRestoreController";
import { postLotterySignups } from "server/features/user/lottery-signup/lotterySignupController";
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
import { ApiEndpoint, AuthEndpoint } from "shared/constants/apiEndpoints";
import {
  getKompassiLoginMockLogout,
  getKompassiLoginMockProfile,
  getKompassiLoginMockRedirect,
  getKompassiLoginMockToken,
} from "server/test/kompassi-mock-service/kompassiMockService";

export const apiRoutes = express.Router();

/* eslint-disable @typescript-eslint/no-misused-promises */

/* POST routes */

apiRoutes.post(ApiEndpoint.PROGRAM_ITEMS, postUpdateProgramItems);
apiRoutes.post(ApiEndpoint.USERS, postUser);
apiRoutes.post(ApiEndpoint.LOGIN, postLogin);
apiRoutes.post(ApiEndpoint.ASSIGNMENT, postAssignment);
apiRoutes.post(ApiEndpoint.LOTTERY_SIGNUP, postLotterySignups);
apiRoutes.post(ApiEndpoint.FAVORITE, postFavorite);
apiRoutes.post(ApiEndpoint.HIDDEN, postHidden);
apiRoutes.post(ApiEndpoint.FEEDBACK, postFeedback);
apiRoutes.post(ApiEndpoint.GROUP, postCreateGroup);
apiRoutes.post(ApiEndpoint.JOIN_GROUP, postJoinGroup);
apiRoutes.post(ApiEndpoint.LEAVE_GROUP, postLeaveGroup);
apiRoutes.post(ApiEndpoint.CLOSE_GROUP, postCloseGroup);
apiRoutes.post(ApiEndpoint.SIGNUP_QUESTION, postSignupQuestion);
apiRoutes.post(ApiEndpoint.SESSION_RESTORE, postSessionRestore);
apiRoutes.post(ApiEndpoint.USERS_PASSWORD, postUserPassword);
apiRoutes.post(ApiEndpoint.SETTINGS, postSettings);
apiRoutes.post(ApiEndpoint.DIRECT_SIGNUP, postDirectSignup);
apiRoutes.post(ApiEndpoint.EVENT_LOG, postEventLogItem);
apiRoutes.post(ApiEndpoint.PROGRAM_UPDATE_CRON, postAutoUpdateProgramItems);
apiRoutes.post(ApiEndpoint.ASSIGNMENT_CRON, postAutoAssignment);
apiRoutes.post(ApiEndpoint.VERIFY_KOMPASSI_LOGIN, postVerifyKompassiLogin);
apiRoutes.post(
  ApiEndpoint.SENTRY_TUNNEL,
  express.raw({ limit: "100mb", type: () => true }),
  postSentryTunnel,
);

/* GET routes */

apiRoutes.get(ApiEndpoint.PROGRAM_ITEMS, getProgramItems);
apiRoutes.get(ApiEndpoint.USERS, getUser);
apiRoutes.get(
  ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME,
  getUserBySerialOrUsername,
);
apiRoutes.get(ApiEndpoint.SETTINGS, getSettings);
apiRoutes.get(ApiEndpoint.RESULTS, getResults);
apiRoutes.get(ApiEndpoint.GROUP, getGroup);
apiRoutes.get(ApiEndpoint.SIGNUP_MESSAGE, getSignupMessages);
apiRoutes.get(ApiEndpoint.SENTRY_TEST, getSentryTest);
apiRoutes.get(ApiEndpoint.HEALTH, getHealthStatus);

/* DELETE routes */

apiRoutes.delete(ApiEndpoint.SIGNUP_QUESTION, deleteSignupQuestion);
apiRoutes.delete(ApiEndpoint.DIRECT_SIGNUP, deleteDirectSignup);

/* DEV routes */

if (process.env.SETTINGS !== "production") {
  apiRoutes.post(ApiEndpoint.TEST_SETTINGS, postTestSettings);
  apiRoutes.get(ApiEndpoint.TEST_SETTINGS, getTestSettings);
  apiRoutes.post(ApiEndpoint.POPULATE_DB, postPopulateDb);
}

/* Kompassi login routes */
// TODO: Disable login endpoints if provider not set
apiRoutes.post(AuthEndpoint.KOMPASSI_LOGIN, postKompassiLoginRedirect);
apiRoutes.post(AuthEndpoint.KOMPASSI_LOGIN_CALLBACK, postKompassiLoginCallback);
apiRoutes.post(AuthEndpoint.KOMPASSI_LOGOUT, postKompassiLogoutRedirect);

if (process.env.NODE_ENV === "development") {
  /* Kompassi login test routes */
  apiRoutes.get("/oauth2/authorize", getKompassiLoginMockRedirect);
  apiRoutes.post("/oauth2/token", getKompassiLoginMockToken);
  apiRoutes.get("/api/v2/people/me", getKompassiLoginMockProfile);
  apiRoutes.get("/logout", getKompassiLoginMockLogout);
}

/* eslint-enable @typescript-eslint/no-misused-promises */

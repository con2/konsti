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
  postUpdateProgramItems,
} from "server/features/program-item/programItemController";
import { getHealthStatus } from "server/features/health/healthController";
import { getSentryTest } from "server/features/sentry-tunnel/sentryTunnelController";
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
import { postEventLogItemIsSeen } from "server/features/user/event-log/eventLogController";
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
import {
  deleteLotterySignup,
  postLotterySignup,
} from "server/features/user/lottery-signup/lotterySignupController";
import { getSignupMessages } from "server/features/user/signup-message/signupMessageController";
import {
  getUser,
  postUser,
  getUserBySerialOrUsername,
  postUserPassword,
  postUpdateUserEmailAddress,
} from "server/features/user/userController";
import {
  postClearDb,
  postAddProgramItems,
  postPopulateDb,
  postAddSerials,
} from "server/test/test-data-generation/testDataController";
import {
  getTestSettings,
  postTestSettings,
} from "server/test/test-settings/testSettingsController";
import {
  ApiDevEndpoint,
  ApiEndpoint,
  AuthEndpoint,
} from "shared/constants/apiEndpoints";
import {
  getKompassiLoginMockLogout,
  getKompassiLoginMockProfile,
  getKompassiLoginMockRedirect,
  getKompassiLoginMockToken,
} from "server/test/kompassi-mock-service/kompassiMockService";
import { postAssignment } from "server/features/assignment/assignmentController";

export const apiRoutes = express.Router();

/* eslint-disable @typescript-eslint/no-misused-promises */

/* POST routes */

apiRoutes.post(ApiEndpoint.PROGRAM_ITEMS, postUpdateProgramItems);
apiRoutes.post(ApiEndpoint.USERS, postUser);
apiRoutes.post(ApiEndpoint.LOGIN, postLogin);
apiRoutes.post(ApiEndpoint.ASSIGNMENT, postAssignment);
apiRoutes.post(ApiEndpoint.LOTTERY_SIGNUP, postLotterySignup);
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
apiRoutes.post(ApiEndpoint.EVENT_LOG_IS_SEEN, postEventLogItemIsSeen);
apiRoutes.post(ApiEndpoint.VERIFY_KOMPASSI_LOGIN, postVerifyKompassiLogin);
apiRoutes.post(
  ApiEndpoint.UPDATE_USER_EMAIL_ADDRESS,
  postUpdateUserEmailAddress,
);

/* GET routes */

apiRoutes.get(ApiEndpoint.PROGRAM_ITEMS, getProgramItems);
apiRoutes.get(ApiEndpoint.USERS, getUser);
apiRoutes.get(
  ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME,
  getUserBySerialOrUsername,
);
apiRoutes.get(ApiEndpoint.SETTINGS, getSettings);
apiRoutes.get(ApiEndpoint.GROUP, getGroup);
apiRoutes.get(ApiEndpoint.SIGNUP_MESSAGE, getSignupMessages);
apiRoutes.get(ApiEndpoint.SENTRY_TEST, getSentryTest);
apiRoutes.get(ApiEndpoint.HEALTH, getHealthStatus);

/* DELETE routes */

apiRoutes.delete(ApiEndpoint.SIGNUP_QUESTION, deleteSignupQuestion);
apiRoutes.delete(ApiEndpoint.DIRECT_SIGNUP, deleteDirectSignup);
apiRoutes.delete(ApiEndpoint.LOTTERY_SIGNUP, deleteLotterySignup);

/* DEV routes */

if (process.env.SETTINGS !== "production") {
  apiRoutes.post(ApiDevEndpoint.TEST_SETTINGS, postTestSettings);
  apiRoutes.get(ApiDevEndpoint.TEST_SETTINGS, getTestSettings);
  apiRoutes.post(ApiDevEndpoint.POPULATE_DB, postPopulateDb);
  apiRoutes.post(ApiDevEndpoint.CLEAR_DB, postClearDb);
  apiRoutes.post(ApiDevEndpoint.ADD_PROGRAM_ITEMS, postAddProgramItems);
  apiRoutes.post(ApiDevEndpoint.ADD_SERIALS, postAddSerials);
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

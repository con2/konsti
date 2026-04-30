import express from "express";
import {
  postKompassiLoginCallback,
  postKompassiLoginRedirect,
  postKompassiLogoutRedirect,
  postVerifyKompassiLogin,
} from "server/features/kompassi-login/kompassiLoginController";
import {
  getProgramItems,
  postUpdateProgramItems,
} from "server/features/program-item/programItemController";
import { getHealthStatus } from "server/features/health/healthController";
import { getSentryTest } from "server/features/sentry-tunnel/sentryTunnelController";
import { postEmailTest } from "server/features/admin/emailTestController";
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
import { validateBody, validateQuery } from "server/middleware/validateRequest";
import { requireAuth } from "server/middleware/requireAuth";
import { logApiCall } from "server/middleware/logApiCall";
import { UserGroup } from "shared/types/models/user";
import {
  PostKompassiLoginRequestSchema,
  PostLoginRequestSchema,
  PostSessionRecoveryRequestSchema,
  PostVerifyKompassiLoginRequestSchema,
} from "shared/types/api/login";
import {
  GetUserBySerialRequestSchema,
  PostUpdateUserPasswordRequestSchema,
  PostUserRequestSchema,
} from "shared/types/api/users";
import { PostAssignmentRequestSchema } from "shared/types/api/assignment";
import {
  DeleteDirectSignupRequestSchema,
  DeleteLotterySignupRequestSchema,
  PostDirectSignupRequestSchema,
  PostLotterySignupRequestSchema,
} from "shared/types/api/myProgramItems";
import { PostFavoriteRequestSchema } from "shared/types/api/favorite";
import {
  DeleteSignupQuestionRequestSchema,
  PostHiddenRequestSchema,
  PostSettingsRequestSchema,
  PostSignupQuestionRequestSchema,
} from "shared/types/api/settings";
import {
  GetGroupRequestSchema,
  PostCloseGroupRequestSchema,
  PostJoinGroupRequestSchema,
} from "shared/types/api/groups";
import { PostEventLogIsSeenRequestSchema } from "shared/types/api/eventLog";
import {
  PopulateDbOptionsSchema,
  PostAddProgramItemsRequestSchema,
  PostAddSerialsRequestSchema,
  PostEmailTestRequestSchema,
} from "shared/test-types/api/testData";
import { PostTestSettingsRequestSchema } from "shared/test-types/api/testSettings";

export const apiRoutes = express.Router();

apiRoutes.use(logApiCall);

/* POST routes */

apiRoutes.post(
  ApiEndpoint.PROGRAM_ITEMS,
  requireAuth(UserGroup.ADMIN),
  postUpdateProgramItems,
);
apiRoutes.post(
  ApiEndpoint.USERS,
  validateBody(PostUserRequestSchema),
  postUser,
);
apiRoutes.post(
  ApiEndpoint.LOGIN,
  validateBody(PostLoginRequestSchema),
  postLogin,
);
apiRoutes.post(
  ApiEndpoint.ASSIGNMENT,
  requireAuth(UserGroup.ADMIN),
  validateBody(PostAssignmentRequestSchema),
  postAssignment,
);
apiRoutes.post(
  ApiEndpoint.LOTTERY_SIGNUP,
  requireAuth(UserGroup.USER),
  validateBody(PostLotterySignupRequestSchema),
  postLotterySignup,
);
apiRoutes.post(
  ApiEndpoint.FAVORITE,
  requireAuth(UserGroup.USER),
  validateBody(PostFavoriteRequestSchema),
  postFavorite,
);
apiRoutes.post(
  ApiEndpoint.HIDDEN,
  requireAuth(UserGroup.ADMIN),
  validateBody(PostHiddenRequestSchema),
  postHidden,
);
apiRoutes.post(ApiEndpoint.GROUP, requireAuth(UserGroup.USER), postCreateGroup);
apiRoutes.post(
  ApiEndpoint.JOIN_GROUP,
  requireAuth(UserGroup.USER),
  validateBody(PostJoinGroupRequestSchema),
  postJoinGroup,
);
apiRoutes.post(
  ApiEndpoint.LEAVE_GROUP,
  requireAuth(UserGroup.USER),
  postLeaveGroup,
);
apiRoutes.post(
  ApiEndpoint.CLOSE_GROUP,
  requireAuth(UserGroup.USER),
  validateBody(PostCloseGroupRequestSchema),
  postCloseGroup,
);
apiRoutes.post(
  ApiEndpoint.SIGNUP_QUESTION,
  requireAuth(UserGroup.ADMIN),
  validateBody(PostSignupQuestionRequestSchema),
  postSignupQuestion,
);
apiRoutes.post(
  ApiEndpoint.SESSION_RESTORE,
  validateBody(PostSessionRecoveryRequestSchema),
  postSessionRestore,
);
apiRoutes.post(
  ApiEndpoint.USERS_PASSWORD,
  requireAuth([UserGroup.USER, UserGroup.HELPER, UserGroup.ADMIN]),
  validateBody(PostUpdateUserPasswordRequestSchema),
  postUserPassword,
);
apiRoutes.post(
  ApiEndpoint.SETTINGS,
  requireAuth(UserGroup.ADMIN),
  validateBody(PostSettingsRequestSchema),
  postSettings,
);
apiRoutes.post(
  ApiEndpoint.DIRECT_SIGNUP,
  requireAuth(UserGroup.USER),
  validateBody(PostDirectSignupRequestSchema),
  postDirectSignup,
);
apiRoutes.post(
  ApiEndpoint.EVENT_LOG_IS_SEEN,
  requireAuth(UserGroup.USER),
  validateBody(PostEventLogIsSeenRequestSchema),
  postEventLogItemIsSeen,
);
apiRoutes.post(
  ApiEndpoint.VERIFY_KOMPASSI_LOGIN,
  requireAuth(UserGroup.USER),
  validateBody(PostVerifyKompassiLoginRequestSchema),
  postVerifyKompassiLogin,
);
apiRoutes.post(
  ApiEndpoint.UPDATE_USER_EMAIL_ADDRESS,
  requireAuth(UserGroup.USER),
  postUpdateUserEmailAddress,
);
apiRoutes.post(
  ApiEndpoint.EMAIL_TEST,
  requireAuth(UserGroup.ADMIN),
  validateBody(PostEmailTestRequestSchema),
  postEmailTest,
);

/* GET routes */

apiRoutes.get(ApiEndpoint.PROGRAM_ITEMS, getProgramItems);
apiRoutes.get(ApiEndpoint.USERS, requireAuth(UserGroup.USER), getUser);
apiRoutes.get(
  ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME,
  requireAuth([UserGroup.HELPER, UserGroup.ADMIN]),
  validateQuery(GetUserBySerialRequestSchema),
  getUserBySerialOrUsername,
);
apiRoutes.get(ApiEndpoint.SETTINGS, getSettings);
apiRoutes.get(
  ApiEndpoint.GROUP,
  requireAuth(UserGroup.USER),
  validateQuery(GetGroupRequestSchema),
  getGroup,
);
apiRoutes.get(
  ApiEndpoint.SIGNUP_MESSAGE,
  requireAuth(UserGroup.HELPER),
  getSignupMessages,
);
apiRoutes.get(
  ApiEndpoint.SENTRY_TEST,
  requireAuth(UserGroup.ADMIN),
  getSentryTest,
);
apiRoutes.get(ApiEndpoint.HEALTH, getHealthStatus);

/* DELETE routes */

apiRoutes.delete(
  ApiEndpoint.SIGNUP_QUESTION,
  requireAuth(UserGroup.ADMIN),
  validateBody(DeleteSignupQuestionRequestSchema),
  deleteSignupQuestion,
);
apiRoutes.delete(
  ApiEndpoint.DIRECT_SIGNUP,
  requireAuth(UserGroup.USER),
  validateBody(DeleteDirectSignupRequestSchema),
  deleteDirectSignup,
);
apiRoutes.delete(
  ApiEndpoint.LOTTERY_SIGNUP,
  requireAuth(UserGroup.USER),
  validateBody(DeleteLotterySignupRequestSchema),
  deleteLotterySignup,
);

/* DEV routes */

// test-settings is also exposed in staging because the staging client uses it
// to override "now" for time-dependent flows (loadData calls it before login)
if (
  process.env.SETTINGS === "development" ||
  process.env.SETTINGS === "ci" ||
  process.env.SETTINGS === "staging"
) {
  apiRoutes.post(
    ApiDevEndpoint.TEST_SETTINGS,
    validateBody(PostTestSettingsRequestSchema),
    postTestSettings,
  );
  apiRoutes.get(ApiDevEndpoint.TEST_SETTINGS, getTestSettings);
}

// Destructive dev tools (DB wipe/repopulate, fixture generation) stay out of
// staging where they could be reached by anyone
if (process.env.SETTINGS === "development" || process.env.SETTINGS === "ci") {
  apiRoutes.post(
    ApiDevEndpoint.POPULATE_DB,
    validateBody(PopulateDbOptionsSchema),
    postPopulateDb,
  );
  apiRoutes.post(ApiDevEndpoint.CLEAR_DB, postClearDb);
  apiRoutes.post(
    ApiDevEndpoint.ADD_PROGRAM_ITEMS,
    validateBody(PostAddProgramItemsRequestSchema),
    postAddProgramItems,
  );
  apiRoutes.post(
    ApiDevEndpoint.ADD_SERIALS,
    validateBody(PostAddSerialsRequestSchema),
    postAddSerials,
  );
}

/* Kompassi login routes */
// TODO: Disable login endpoints if provider not set
apiRoutes.post(AuthEndpoint.KOMPASSI_LOGIN, postKompassiLoginRedirect);
apiRoutes.post(
  AuthEndpoint.KOMPASSI_LOGIN_CALLBACK,
  validateBody(PostKompassiLoginRequestSchema),
  postKompassiLoginCallback,
);
apiRoutes.post(AuthEndpoint.KOMPASSI_LOGOUT, postKompassiLogoutRedirect);

if (process.env.NODE_ENV === "development") {
  /* Kompassi login test routes */
  apiRoutes.get("/oauth2/authorize", getKompassiLoginMockRedirect);
  apiRoutes.post("/oauth2/token", getKompassiLoginMockToken);
  apiRoutes.get("/api/v2/people/me", getKompassiLoginMockProfile);
  apiRoutes.get("/logout", getKompassiLoginMockLogout);
}

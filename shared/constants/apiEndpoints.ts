export enum ApiEndpoint {
  USERS = "/api/users",
  USERS_BY_SERIAL_OR_USERNAME = "/api/users/serial-or-username",
  PROGRAM_ITEMS = "/api/program-items",
  LOGIN = "/api/login",
  ASSIGNMENT = "/api/assignment",
  LOTTERY_SIGNUP = "/api/lottery-signup",
  FAVORITE = "/api/favorite",
  HIDDEN = "/api/hidden",
  FEEDBACK = "/api/feedback",
  GROUP = "/api/group",
  JOIN_GROUP = "/api/join-group",
  LEAVE_GROUP = "/api/leave-group",
  CLOSE_GROUP = "/api/close-group",
  SETTINGS = "/api/settings",
  SIGNUP_QUESTION = "/api/signup-question",
  SIGNUP_MESSAGE = "/api/signup-message",
  SESSION_RESTORE = "/api/session-restore",
  USERS_PASSWORD = "/api/users/password",
  DIRECT_SIGNUP = "/api/direct-signup",
  SENTRY_TUNNEL = "/api/sentry",
  SENTRY_TEST = "/api/sentry-test",
  EVENT_LOG_IS_SEEN = "/api/event-log-is-seen",
  HEALTH = "/api/health",
  VERIFY_KOMPASSI_LOGIN = "/api/verify-kompassi-login",
  UPDATE_USER_EMAIL_ADDRESS = "/api/update-user-email-address",
}

export enum ApiDevEndpoint {
  TEST_SETTINGS = "/api/test-settings",
  POPULATE_DB = "/api/populate-db",
  CLEAR_DB = "/api/clear-db",
  ADD_PROGRAM_ITEMS = "/api/add-program-item",
  ADD_SERIALS = "/api/add-serial",
}

export enum AuthEndpoint {
  KOMPASSI_LOGIN = "/auth/kompassi",
  KOMPASSI_LOGIN_CALLBACK = "/auth/kompassi/callback",
  KOMPASSI_LOGOUT = "/auth/kompassi/logout",
}

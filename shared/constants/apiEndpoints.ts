export enum ApiEndpoint {
  USERS = "/api/users",
  USERS_BY_SERIAL_OR_USERNAME = "/api/users/serial-or-username",
  GAMES = "/api/games",
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
  RESULTS = "/api/results",
  SIGNUP_QUESTION = "/api/signup-question",
  SIGNUP_MESSAGE = "/api/signup-message",
  SESSION_RESTORE = "/api/session-restore",
  USERS_PASSWORD = "/api/users/password",
  TEST_SETTINGS = "/api/test-settings",
  POPULATE_DB = "/api/populate-db",
  SIGNUP = "/api/signup",
  SENTRY_TUNNEL = "/api/sentry",
  SENTRY_TEST = "/api/sentry-test",
  EVENT_LOG = "/api/event-log",
  PROGRAM_UPDATE_CRON = "/api/program-update-cron",
  ASSIGNMENT_CRON = "/api/assignment-cron",
  HEALTH = "/api/health",
  VERIFY_KOMPASSI_LOGIN = "/api/verify-kompassi-login",
}

export enum AuthEndpoint {
  KOMPASSI_LOGIN = "/auth/kompassi",
  KOMPASSI_LOGIN_CALLBACK = "/auth/kompassi/callback",
  KOMPASSI_LOGOUT = "/auth/kompassi/logout",
}

import { Config, GameUpdateMethod } from "server/typings/config.typings";

const commonConfig = {
  // Server settings
  port:
    typeof process.env.PORT === "string"
      ? parseInt(process.env.PORT, 10)
      : 5000,
  debug: false,

  // Logging
  logDir: "./logs",
  enableAccessLog: false,

  // App settings
  bundleCompression: true,
  enableRemoveOverlapSignups: true,
  gamePopularityUpdateMethod: GameUpdateMethod.assign, // 'signups', 'assign'

  // Development and testing
  saveTestAssign: true,

  // Convention settings
  dataUri: "https://kompassi.eu/api/v1/events/ropecon2021/programme/ropecon",
  firtSignupBonus: 20,

  // Statistics
  statsDataDir: "src/features/statistics/datafiles",
};

const prodConfig = {
  dbConnString: process.env.CONN_STRING ?? "",
  dbName: "konsti",
  jwtSecretKey: process.env.JWT_SECRET_KEY ?? "",
  jwtSecretKeyAdmin: process.env.JWT_SECRET_KEY_ADMIN ?? "",
  jwtSecretKeyHelp: process.env.JWT_SECRET_KEY_HELP ?? "",
  allowedCorsOrigins:
    typeof process.env.CORS_WHITELIST === "string"
      ? process.env.CORS_WHITELIST.split(";")
      : [],
  useLocalProgramFile: false,
  debug: process.env.DEBUG === "true" || false,
  GROUP_ASSIGNMENT_ROUNDS: 300,
  PADG_ASSIGNMENT_ROUNDS: 300,
  RANDOM_ASSIGNMENT_ROUNDS: 300,
  updateGamePopularityEnabled: true,
  enableSignupTimeCheck: true,

  // Cron
  autoUpdateGamesEnabled: true,
  gameUpdateInterval: 4, // minutes
  autoUpdateGamePopularityEnabled: true,
  autoAssignPlayersEnabled: true,
};

const stagingConfig = {
  dbConnString: process.env.CONN_STRING ?? "",
  dbName: "konsti",
  jwtSecretKey: process.env.JWT_SECRET_KEY ?? "",
  jwtSecretKeyAdmin: process.env.JWT_SECRET_KEY_ADMIN ?? "",
  jwtSecretKeyHelp: process.env.JWT_SECRET_KEY_HELP ?? "",
  allowedCorsOrigins:
    typeof process.env.CORS_WHITELIST === "string"
      ? process.env.CORS_WHITELIST.split(";")
      : [],
  useLocalProgramFile: false,
  debug: process.env.DEBUG === "true" || false,
  GROUP_ASSIGNMENT_ROUNDS: 300,
  PADG_ASSIGNMENT_ROUNDS: 300,
  RANDOM_ASSIGNMENT_ROUNDS: 300,
  updateGamePopularityEnabled: true,
  enableSignupTimeCheck: false,

  // Cron
  autoUpdateGamesEnabled: false,
  gameUpdateInterval: 4, // minutes
  autoUpdateGamePopularityEnabled: false,
  autoAssignPlayersEnabled: false,
};

const devConfig = {
  dbConnString: process.env.CONN_STRING ?? "mongodb://localhost:27017",
  dbName: process.env.DB_NAME ?? "konsti",
  jwtSecretKey: "secret",
  jwtSecretKeyAdmin: "admin secret",
  jwtSecretKeyHelp: "help secret",
  allowedCorsOrigins: [
    "http://localhost:8000",
    "http://localhost:5000",
    "https://server:5000",
  ],
  useLocalProgramFile: false,
  debug: false,
  GROUP_ASSIGNMENT_ROUNDS: 1,
  PADG_ASSIGNMENT_ROUNDS: 300,
  RANDOM_ASSIGNMENT_ROUNDS: 10,
  updateGamePopularityEnabled: true,
  enableSignupTimeCheck: false,

  // Cron
  autoUpdateGamesEnabled: false,
  gameUpdateInterval: 4, // minutes
  autoUpdateGamePopularityEnabled: false,
  autoAssignPlayersEnabled: false,
};

const combineConfig = (): Config => {
  if (process.env.SETTINGS === "production") {
    return { ...commonConfig, ...prodConfig };
  } else if (process.env.SETTINGS === "staging") {
    return { ...commonConfig, ...stagingConfig };
  }
  return { ...commonConfig, ...devConfig };
};

export const config: Config = combineConfig();

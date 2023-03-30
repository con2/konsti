enum GameUpdateMethod {
  signups = "signups",
  assign = "assign",
}

interface Config {
  port: number;
  debug: boolean;
  logDir: string;
  enableAccessLog: boolean;
  dbConnString: string;
  dbName: string;
  jwtSecretKey: string;
  jwtSecretKeyAdmin: string;
  jwtSecretKeyHelp: string;
  allowedCorsOrigins: readonly string[];
  dataUri: string;
  GROUP_ASSIGNMENT_ROUNDS: number;
  PADG_ASSIGNMENT_ROUNDS: number;
  RANDOM_ASSIGNMENT_ROUNDS: number;
  bundleCompression: boolean;
  autoUpdateGamesEnabled: boolean;
  gameUpdateInterval: string;
  enableRemoveOverlapSignups: boolean;
  saveTestAssign: boolean;
  autoUpdateGamePopularityEnabled: boolean;
  gamePopularityUpdateMethod: GameUpdateMethod;
  updateGamePopularityEnabled: boolean;
  useLocalProgramFile: boolean;
  autoAssignPlayersEnabled: boolean;
  firtSignupBonus: number;
  statsDataDir: string;
  autoAssignDelay: number;
  autoAssignInterval: string;
  useTestTime: boolean;
  localKompassiFile: string;
}

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
  dataUri: "https://kompassi.eu/api/v1/events/ropecon2022/programme/ropecon",
  firtSignupBonus: 20,

  // Statistics
  statsDataDir: "src/features/statistics/datafiles",

  // Testing
  localKompassiFile: "program-ropecon-2022-test.json",
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

  // Dev
  useTestTime: false,

  // Game update cron
  autoUpdateGamesEnabled: false,
  gameUpdateInterval: `*/4 * * * *`,
  autoUpdateGamePopularityEnabled: true,

  // Player assign cron
  autoAssignPlayersEnabled: true,
  autoAssignInterval: `0,15,30,45 * * * *`,
  autoAssignDelay: 1000 * 10,
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

  // Dev
  useTestTime: true,

  // Game update cron
  autoUpdateGamesEnabled: true,
  gameUpdateInterval: `*/4 * * * *`,
  autoUpdateGamePopularityEnabled: true,

  // Player assign cron
  autoAssignPlayersEnabled: true,
  autoAssignInterval: `0,15,30,45 * * * *`,
  autoAssignDelay: 1000 * 10,
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
  GROUP_ASSIGNMENT_ROUNDS: 10,
  PADG_ASSIGNMENT_ROUNDS: 300,
  RANDOM_ASSIGNMENT_ROUNDS: 10,
  updateGamePopularityEnabled: true,

  // Dev
  useTestTime: true,

  // Game update cron
  autoUpdateGamesEnabled: false,
  gameUpdateInterval: `*/10 * * * *`,
  autoUpdateGamePopularityEnabled: false,

  // Player assign cron
  autoAssignPlayersEnabled: false,
  autoAssignInterval: `0,15,30,45 * * * * *`,
  autoAssignDelay: 1000 * 1,
};

const combineConfig = (): Config => {
  switch (process.env.SETTINGS) {
    case "production":
      return { ...commonConfig, ...prodConfig };
    case "staging":
      return { ...commonConfig, ...stagingConfig };
    default:
      return { ...commonConfig, ...devConfig };
  }
};

export const config: Config = combineConfig();

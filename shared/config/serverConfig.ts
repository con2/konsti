export enum GameUpdateMethod {
  SIGNUPS = "signups",
  ASSIGN = "assign",
}

enum DataUri {
  ROPECON = "https://kompassi.eu/api/v1/events/ropecon2023/programme/ropecon",
  HITPOINT = "https://kompassi.eu/api/v1/events/hitpoint2023/programme/hitpoint",
}

export interface ServerConfig {
  port: number;
  debug: boolean;
  enableAccessLog: boolean;
  dbConnString: string;
  dbName: string;
  jwtSecretKey: string;
  jwtSecretKeyAdmin: string;
  jwtSecretKeyHelp: string;
  allowedCorsOrigins: readonly string[];
  dataUri: DataUri;
  GROUP_ASSIGNMENT_ROUNDS: number;
  PADG_ASSIGNMENT_ROUNDS: number;
  RANDOM_ASSIGNMENT_ROUNDS: number;
  bundleCompression: boolean;
  autoUpdateGamesEnabled: boolean;
  gameUpdateInterval: string;
  enableRemoveOverlapSignups: boolean;
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
  consoleLogFormatJson: boolean;
  enableLoggingInTests: boolean;
  onlyCronjobs: boolean;
}

const commonConfig = {
  // Server settings
  port:
    typeof process.env.PORT === "string"
      ? parseInt(process.env.PORT, 10)
      : 5000,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  onlyCronjobs: process.env.ONLY_CRONJOBS === "true" ?? false,

  // Logging
  enableAccessLog: false,

  // App settings
  bundleCompression: true,
  enableRemoveOverlapSignups: true,
  gamePopularityUpdateMethod: GameUpdateMethod.ASSIGN,

  // Convention settings
  dataUri: DataUri.HITPOINT,
  firtSignupBonus: 20,
  useLocalProgramFile: false,
  localKompassiFile: "program-hitpoint-2023.json",

  // Statistics
  statsDataDir: "src/features/statistics/datafiles",

  // Tests
  enableLoggingInTests: false,
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
  debug: process.env.DEBUG === "true" || false,
  GROUP_ASSIGNMENT_ROUNDS: 300,
  PADG_ASSIGNMENT_ROUNDS: 300,
  RANDOM_ASSIGNMENT_ROUNDS: 300,
  consoleLogFormatJson: true,

  // Dev
  useTestTime: false,

  // Program update cron
  autoUpdateGamesEnabled: true,
  gameUpdateInterval: `5,10,20,25,35,40,50,55 * * * *`,

  // Program update
  updateGamePopularityEnabled: true,

  // Player assign cron
  autoAssignPlayersEnabled: true,
  autoAssignInterval: `0,15,30,45 * * * *`,
  autoAssignDelay: 1000 * 5,
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
  debug: process.env.DEBUG === "true" || false,
  GROUP_ASSIGNMENT_ROUNDS: 300,
  PADG_ASSIGNMENT_ROUNDS: 300,
  RANDOM_ASSIGNMENT_ROUNDS: 300,
  consoleLogFormatJson: true,

  // Dev
  useTestTime: true,

  // Program update cron
  autoUpdateGamesEnabled: true,
  gameUpdateInterval: `5,10,20,25,35,40,50,55 * * * *`,

  // Program update
  updateGamePopularityEnabled: true,

  // Player assign cron
  autoAssignPlayersEnabled: true,
  autoAssignInterval: `0,15,30,45 * * * *`,
  autoAssignDelay: 1000 * 5,
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
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5000",
    "https://server:5000",
  ],
  debug: false,
  GROUP_ASSIGNMENT_ROUNDS: 10,
  PADG_ASSIGNMENT_ROUNDS: 300,
  RANDOM_ASSIGNMENT_ROUNDS: 10,
  consoleLogFormatJson: false,

  // Dev
  useTestTime: true,

  // Program update cron
  autoUpdateGamesEnabled: true,
  gameUpdateInterval: `5,10,20,25,35,40,50,55 * * * *`,

  // Program update
  updateGamePopularityEnabled: true,

  // Player assign cron
  autoAssignPlayersEnabled: true,
  autoAssignInterval: `0,15,30,45 * * * *`,
  autoAssignDelay: 1000 * 1,
};

const combineConfig = (): ServerConfig => {
  switch (process.env.SETTINGS) {
    case "production":
      return { ...commonConfig, ...prodConfig };
    case "staging":
      return { ...commonConfig, ...stagingConfig };
    default:
      return { ...commonConfig, ...devConfig };
  }
};

export const serverConfig: ServerConfig = combineConfig();
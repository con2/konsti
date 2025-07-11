import {
  LoginProvider,
  EventSignupStrategy,
} from "shared/config/eventConfigTypes";

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
  padgAssignmentRounds: number;
  randomAssignmentRounds: number;
  bundleCompression: boolean;
  autoUpdateProgramEnabled: boolean;
  programUpdateInterval: string;
  updateProgramItemPopularityEnabled: boolean;
  useLocalProgramFile: boolean;
  autoAssignAttendeesEnabled: boolean;
  firstSignupBonus: number;
  additionalFirstSignupBonus: number;
  statsDataDir: string;
  autoAssignDelay: number;
  autoAssignInterval: string;
  useTestTime: boolean;
  localKompassiFile: string;
  consoleLogFormatJson: boolean;
  enableLoggingInTests: boolean;
  onlyCronjobs: boolean;
  defaultSignupStrategy: EventSignupStrategy;
  defaultLoginProvider: LoginProvider;
}

const getAllowedCorsOrigins = (localOrigins: string[] = []): string[] => {
  const envVariableOrigins =
    typeof process.env.CORS_WHITELIST === "string"
      ? process.env.CORS_WHITELIST.split(";")
      : [];

  return [...envVariableOrigins, ...localOrigins];
};

const commonConfig = {
  // Server settings
  port:
    typeof process.env.PORT === "string"
      ? Number.parseInt(process.env.PORT, 10)
      : 5000,
  onlyCronjobs: process.env.ONLY_CRONJOBS === "true" ? true : false,

  // Logging
  enableAccessLog: false,

  // App settings
  bundleCompression: true,

  // Default DB values
  defaultSignupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  defaultLoginProvider: LoginProvider.LOCAL_KOMPASSI,

  // Event settings
  padgAssignmentRounds: 5,
  randomAssignmentRounds: 300,
  firstSignupBonus: 20,
  additionalFirstSignupBonus: 5,
  useLocalProgramFile: false,
  localKompassiFile: "program-ropecon-2025.json",

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
  allowedCorsOrigins: getAllowedCorsOrigins(),
  debug: process.env.DEBUG === "true" || false,
  consoleLogFormatJson: true,

  // Dev
  useTestTime: false,

  // Program update cron
  autoUpdateProgramEnabled: false,
  programUpdateInterval: "5,10,20,25,35,40,50,55 * * * *",

  // Program update
  updateProgramItemPopularityEnabled: false,

  // Attendee assign cron
  autoAssignAttendeesEnabled: false,
  autoAssignInterval: "0,15,30,45 * * * *",
  autoAssignDelay: 1000 * 5,
};

const stagingConfig = {
  dbConnString: process.env.CONN_STRING ?? "",
  dbName: "konsti",
  jwtSecretKey: process.env.JWT_SECRET_KEY ?? "",
  jwtSecretKeyAdmin: process.env.JWT_SECRET_KEY_ADMIN ?? "",
  jwtSecretKeyHelp: process.env.JWT_SECRET_KEY_HELP ?? "",
  allowedCorsOrigins: getAllowedCorsOrigins(),
  debug: process.env.DEBUG === "true" || false,
  consoleLogFormatJson: true,

  // Dev
  useTestTime: true,

  // Program update cron
  autoUpdateProgramEnabled: true,
  programUpdateInterval: "5,10,20,25,35,40,50,55 * * * *",

  // Program update
  updateProgramItemPopularityEnabled: true,

  // Attendee assign cron
  autoAssignAttendeesEnabled: true,
  autoAssignInterval: "0,15,30,45 * * * *",
  autoAssignDelay: 1000 * 5,
};

const devConfig = {
  dbConnString: process.env.CONN_STRING ?? "mongodb://localhost:27017",
  dbName: process.env.DB_NAME ?? "konsti",
  jwtSecretKey: "secret",
  jwtSecretKeyAdmin: "admin secret",
  jwtSecretKeyHelp: "help secret",
  allowedCorsOrigins: getAllowedCorsOrigins([
    "http://localhost:8000",
    "http://localhost:5000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5000",
    "http://server:5000",
  ]),
  debug: false,
  consoleLogFormatJson: false,

  // Dev
  useTestTime: true,

  // Program update cron
  autoUpdateProgramEnabled: true,
  programUpdateInterval: "5,10,20,25,35,40,50,55 * * * *",

  // Program update
  updateProgramItemPopularityEnabled: true,

  // Attendee assign cron
  autoAssignAttendeesEnabled: true,
  autoAssignInterval: "0,15,30,45 * * * *",
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

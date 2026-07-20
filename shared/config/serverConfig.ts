import { EmailNotificationTrigger } from "shared/types/emailNotification";

export interface ServerConfig {
  port: number;
  logLevel: string;
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
  cronjobsAndBackendSameInstance: boolean;
  logInvalidStartTimes: boolean;
  logMissingScheduleItems: boolean; // If scheduleItems is missing, program item is ignored
  emailNotificationQueueWorkerCount: number;
  emailNotificationTrigger: readonly EmailNotificationTrigger[];
  emailSendFromAddress: string;
  emailSMTPHost: string;
  emailSMTPPort: number;
  emailSMTPUsername: string;
  emailSMTPPassword: string;
}

const getAllowedCorsOrigins = (localOrigins: string[] = []): string[] => {
  const envVariableOrigins =
    typeof process.env.CORS_WHITELIST === "string"
      ? process.env.CORS_WHITELIST.split(";")
      : [];

  return [...envVariableOrigins, ...localOrigins];
};

// PORT_OFFSET lets several local instances (e.g. one per git worktree) run side
// by side without colliding: it shifts the server and client ports by the same
// amount and picks a per-instance dev database name. Default 0 keeps the classic
// 5000/8000 ports
const portOffset = Number(process.env.PORT_OFFSET) || 0;
const defaultServerPort = 5000 + portOffset;
const clientPort = 8000 + portOffset;
const devDbName = portOffset === 0 ? "konsti" : `konsti-${portOffset}`;

const commonConfig = {
  // Server settings
  port:
    typeof process.env.PORT === "string"
      ? Number(process.env.PORT)
      : defaultServerPort,
  onlyCronjobs: process.env.ONLY_CRONJOBS === "true" ? true : false,
  cronjobsAndBackendSameInstance: false, // Set this to run cronjobs and http/api server on same instance

  // App settings
  bundleCompression: true,

  // Event settings
  padgAssignmentRounds: 5,
  randomAssignmentRounds: 300,
  firstSignupBonus: 20,
  additionalFirstSignupBonus: 5,
  useLocalProgramFile: false,
  localKompassiFile: "program-ropecon-2026.json",

  // Statistics
  statsDataDir: "src/features/statistics/datafiles",

  // Logging: LOG_LEVEL caps winston console output, e.g. "debug" enables the
  // debug logs and the Playwright scripts set "warn" to hide the per-request
  // info logs
  logLevel: process.env.LOG_LEVEL ?? "info",

  // Tests
  enableLoggingInTests: false,

  // Data checks
  logInvalidStartTimes: false,
  logMissingScheduleItems: false,

  // Email notifications
  emailNotificationTrigger: [
    EmailNotificationTrigger.ACCEPTED,
    EmailNotificationTrigger.REJECTED,
    EmailNotificationTrigger.PROGRAM_ITEM_CANCELLED,
    EmailNotificationTrigger.PROGRAM_ITEM_DELETED,
    EmailNotificationTrigger.PROGRAM_ITEM_NO_KONSTI_SIGNUP_ANYMORE,
    EmailNotificationTrigger.PROGRAM_ITEM_NO_LOTTERY_ANYMORE,
    EmailNotificationTrigger.PROGRAM_ITEM_TIME_CHANGED,
  ],
  emailNotificationQueueWorkerCount: 1,
  emailSendFromAddress: "Konsti <konsti@kompassi.eu>",
  emailSMTPHost: "smtp.ethereal.email",
  emailSMTPPort: 587,
  emailSMTPUsername: "",
  emailSMTPPassword: "",
};

const prodConfig = {
  dbConnString: process.env.CONN_STRING ?? "",
  dbName: "konsti",
  jwtSecretKey: process.env.JWT_SECRET_KEY ?? "",
  jwtSecretKeyAdmin: process.env.JWT_SECRET_KEY_ADMIN ?? "",
  jwtSecretKeyHelp: process.env.JWT_SECRET_KEY_HELP ?? "",
  allowedCorsOrigins: getAllowedCorsOrigins(),
  consoleLogFormatJson: true,

  // Dev
  useTestTime: false,

  // Program update cron
  autoUpdateProgramEnabled: true,
  programUpdateInterval: "5,10,15,20,25,35,40,45,50,55 * * * *",

  // Program update
  updateProgramItemPopularityEnabled: true,

  // Attendee assign cron
  autoAssignAttendeesEnabled: true,
  autoAssignInterval: "0,30 * * * *",
  autoAssignDelay: 1000 * 5,
  emailSendFromAddress: "Konsti <konsti@kompassi.eu>",
  emailSMTPHost: "sr1.pahaip.fi",
  emailSMTPPort: 25,
};

const stagingConfig = {
  dbConnString: process.env.CONN_STRING ?? "",
  dbName: "konsti",
  jwtSecretKey: process.env.JWT_SECRET_KEY ?? "",
  jwtSecretKeyAdmin: process.env.JWT_SECRET_KEY_ADMIN ?? "",
  jwtSecretKeyHelp: process.env.JWT_SECRET_KEY_HELP ?? "",
  allowedCorsOrigins: getAllowedCorsOrigins(),
  consoleLogFormatJson: true,

  // Dev
  useTestTime: true,

  // Program update cron
  autoUpdateProgramEnabled: true,
  programUpdateInterval: "5,10,15,20,25,35,40,45,50,55 * * * *",

  // Program update
  updateProgramItemPopularityEnabled: true,

  // Attendee assign cron
  autoAssignAttendeesEnabled: true,
  autoAssignInterval: "0,30 * * * *",
  autoAssignDelay: 1000 * 5,
};

const devConfig = {
  dbConnString: process.env.CONN_STRING ?? "mongodb://localhost:27017",
  dbName: process.env.DB_NAME ?? devDbName,
  jwtSecretKey: "secret",
  jwtSecretKeyAdmin: "admin secret",
  jwtSecretKeyHelp: "help secret",
  allowedCorsOrigins: getAllowedCorsOrigins([
    `http://localhost:${clientPort}`,
    `http://localhost:${defaultServerPort}`,
    `http://127.0.0.1:${clientPort}`,
    `http://127.0.0.1:${defaultServerPort}`,
    "http://server:5000",
  ]),
  consoleLogFormatJson: false,

  // Dev
  useTestTime: true,

  // Program update cron
  autoUpdateProgramEnabled: false,
  programUpdateInterval: "5,10,15,20,25,35,40,45,50,55 * * * *",

  // Program update
  updateProgramItemPopularityEnabled: true,

  // Attendee assign cron
  autoAssignAttendeesEnabled: false,
  autoAssignInterval: "0,30 * * * *",
  autoAssignDelay: 1000 * 1,
};

export const combineConfig = (): ServerConfig => {
  switch (process.env.SETTINGS) {
    case "production":
      return { ...commonConfig, ...prodConfig };
    case "staging":
      return { ...commonConfig, ...stagingConfig };
    case "development":
    case "ci":
      return { ...commonConfig, ...devConfig };
    default:
      // Fail closed: deployed pods always run with NODE_ENV=production, so an unrecognized
      // or missing SETTINGS there must not silently fall back to devConfig's public JWT
      // secrets — refuse to start instead. Local/test runs (any other NODE_ENV) keep devConfig
      if (process.env.NODE_ENV === "production") {
        // eslint-disable-next-line no-restricted-syntax -- fail fast on startup misconfiguration
        throw new Error(
          `Refusing to start: SETTINGS="${process.env.SETTINGS ?? ""}" is not a valid config profile for a production deployment`,
        );
      }
      return { ...commonConfig, ...devConfig };
  }
};

export const serverConfig: ServerConfig = combineConfig();

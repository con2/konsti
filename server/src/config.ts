import {
  Config,
  AssignmentStrategy,
  GameUpdateMethod,
} from 'typings/config.typings';

const commonConfig = {
  // App info
  appName: 'Konsti',

  // Server settings
  port:
    typeof process.env.PORT === 'string'
      ? parseInt(process.env.PORT, 10)
      : 3000,
  debug: false,

  // Logging
  logDir: './logs',
  enableAccessLog: false,

  // App settings
  assignmentStrategy: AssignmentStrategy.groupPadg, // 'munkres', 'group', 'padg', 'group+padg'
  bundleCompression: true,
  CONVENTION_START_TIME: '2019-11-23T08:00:00Z', // UTC date
  enableRemoveOverlapSignups: true,
  gamePopularityUpdateMethod: GameUpdateMethod.assign, // 'signups', 'assign'

  // Development and testing
  saveTestAssign: true,

  // Convention settings
  dataUri: 'https://kompassi.eu/api/v1/events/hitpoint2019/programme/hitpoint',

  firtSignupBonus: 20,
};

const prodConfig = {
  dbConnString: process.env.CONN_STRING ?? '',
  dbName: 'konsti',
  jwtSecretKey: process.env.JWT_SECRET_KEY ?? '',
  jwtSecretKeyAdmin: process.env.JWT_SECRET_KEY_ADMIN ?? '',
  allowedCorsOrigins:
    typeof process.env.CORS_WHITELIST === 'string'
      ? process.env.CORS_WHITELIST.split(';')
      : [],
  useLocalProgramFile: false,
  debug: process.env.DEBUG === 'true' || false,
  GROUP_ASSIGNMENT_ROUNDS: 300,
  PADG_ASSIGNMENT_ROUNDS: 300,
  updateGamePopularityEnabled: true,
  enableSignupTimeCheck: true,

  // Cron
  autoUpdateGamesEnabled: true,
  autoUpdateGamePopularityEnabled: true,
  gameUpdateInterval: 4, // minutes
  autoAssignPlayersEnabled: true,
};

const stagingConfig = {
  dbConnString: process.env.CONN_STRING ?? '',
  dbName: 'konsti',
  jwtSecretKey: process.env.JWT_SECRET_KEY ?? '',
  jwtSecretKeyAdmin: process.env.JWT_SECRET_KEY_ADMIN ?? '',
  allowedCorsOrigins:
    typeof process.env.CORS_WHITELIST === 'string'
      ? process.env.CORS_WHITELIST.split(';')
      : [],
  useLocalProgramFile: false,
  debug: process.env.DEBUG === 'true' || false,
  GROUP_ASSIGNMENT_ROUNDS: 300,
  PADG_ASSIGNMENT_ROUNDS: 300,
  updateGamePopularityEnabled: true,
  enableSignupTimeCheck: false,

  // Cron
  autoUpdateGamesEnabled: true,
  autoUpdateGamePopularityEnabled: true,
  gameUpdateInterval: 4, // minutes
  autoAssignPlayersEnabled: false,
};

const devConfig = {
  dbConnString: process.env.CONN_STRING ?? 'mongodb://localhost:27017',
  dbName: 'konsti',
  jwtSecretKey: 'secret',
  jwtSecretKeyAdmin: 'admin secret',
  allowedCorsOrigins: ['http://localhost:8000'],
  useLocalProgramFile: false,
  debug: false,
  GROUP_ASSIGNMENT_ROUNDS: 1,
  PADG_ASSIGNMENT_ROUNDS: 300,
  updateGamePopularityEnabled: true,
  enableSignupTimeCheck: false,

  // Cron
  autoUpdateGamesEnabled: false,
  autoUpdateGamePopularityEnabled: false,
  gameUpdateInterval: 4, // minutes
  autoAssignPlayersEnabled: false,
};

const combineConfig = (): Config => {
  if (process.env.SETTINGS === 'production') {
    return { ...commonConfig, ...prodConfig };
  } else if (process.env.SETTINGS === 'staging') {
    return { ...commonConfig, ...stagingConfig };
  }
  return { ...commonConfig, ...devConfig };
};

export const config: Config = combineConfig();

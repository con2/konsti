import { Config } from './typings/config.typings';

const commonConfig = {
  // App info
  appName: 'Konsti',

  // App status
  apiServerURL:
    typeof process.env.API_SERVER_URL === 'string'
      ? process.env.API_SERVER_URL
      : 'http://localhost:3000',

  // App settings
  loadedSettings:
    typeof process.env.SETTINGS === 'string'
      ? process.env.SETTINGS
      : 'development',
  SIGNUP_END_TIME: 30, // minutes
  SIGNUP_OPEN_TIME: 4, // hours
  MESSAGE_DELAY: 3000, // ms

  // Convention settings
  CONVENTION_NAME: 'Ropecon' as const,
  CONVENTION_YEAR: '2020',
  CONVENTION_START_TIME: '2019-11-23T08:00:00Z', // UTC date
  DAY_START_TIME: 8, // 08:00
  noSignupGames: [],
  revolvingDoorEnabled: false,
  tagFilteringEnabled: true,
  simpleDetails: true,

  // Dev
  reduxTrace: false,
  enableAxe: false,
  enableWhyDidYouRender: false,
};

const prodConfig = {
  useTestTime: false,
  dataUpdateInterval: 60, // seconds
};

const stagingConfig = {
  useTestTime: true,
  dataUpdateInterval: 60, // seconds
};

const devConfig = {
  useTestTime: true,
  dataUpdateInterval: 60, // seconds
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

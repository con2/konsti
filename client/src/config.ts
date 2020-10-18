import { Config } from './typings/config.typings';

const settings = typeof SETTINGS !== 'undefined' ? SETTINGS : 'development';

const commonConfig = {
  // App info
  appName: 'Konsti',

  // App settings
  loadedSettings: settings,
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
  apiServerUrl: 'https://ropekonsti.fi',
  useTestTime: false,
  dataUpdateInterval: 60, // seconds
};

const stagingConfig = {
  apiServerUrl: 'https://test.ropekonsti.fi',
  useTestTime: true,
  dataUpdateInterval: 60, // seconds
};

const devConfig = {
  apiServerUrl: 'http://localhost:5000',
  useTestTime: true,
  dataUpdateInterval: 60, // seconds
};

const combineConfig = (): Config => {
  if (settings === 'production') {
    return { ...commonConfig, ...prodConfig };
  } else if (settings === 'staging') {
    return { ...commonConfig, ...stagingConfig };
  }
  return { ...commonConfig, ...devConfig };
};

export const config: Config = combineConfig();

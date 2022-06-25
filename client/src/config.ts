import { Config } from "./typings/config.typings";

export const config: Config = {
  // App settings
  MESSAGE_DELAY: 3000, // ms

  // Convention settings
  noSignupGames: [],

  // Dev
  enableReduxTrace: false,
  enableAxe: false,
  enableWhyDidYouRender: false,

  // Environment dependent
  loadedSettings: process.env.SETTINGS ?? "development",
  apiServerUrl: process.env.API_SERVER_URL ?? "http://localhost:5000",
  showTestValues: process.env.SHOW_TEST_VALUES === "true" || false,
  dataUpdateInterval: Number(process.env.DATA_UPDATE_INTERVAL) ?? 60, // seconds
};

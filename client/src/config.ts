interface Config {
  MESSAGE_DELAY: number;
  apiServerUrl: string;
  showTestValues: boolean;
  enableReduxTrace: boolean;
  loadedSettings: string;
  enableAxe: boolean;
  enableWhyDidYouRender: boolean;
  dataUpdateInterval: number;
  noSignupGames: string[];
  enableStrategyTestValue: boolean;
  enableRevolvingDoor: boolean;
  enableOrganizerFeedback: boolean;
  enableTagDropdown: boolean;
  alwaysShowAllProgramItems: boolean;
  showAnnouncement: boolean;
}

export const config: Config = {
  // App settings
  MESSAGE_DELAY: 3000, // ms

  // Convention settings
  noSignupGames: [],
  enableRevolvingDoor: false,
  enableOrganizerFeedback: false,
  enableTagDropdown: false,
  alwaysShowAllProgramItems: true,
  showAnnouncement: false,

  // Dev
  enableReduxTrace: false,
  enableAxe: false,
  enableWhyDidYouRender: false,
  enableStrategyTestValue: false,

  // Environment dependent
  loadedSettings: process.env.SETTINGS ?? "development",
  apiServerUrl: process.env.API_SERVER_URL ?? "http://localhost:5000",
  showTestValues: process.env.SHOW_TEST_VALUES === "true" || false,
  dataUpdateInterval: Number(process.env.DATA_UPDATE_INTERVAL) ?? 60, // seconds
};

interface Config {
  MESSAGE_DELAY: number;
  apiServerUrl: string;
  showTestValues: boolean;
  enableReduxTrace: boolean;
  loadedSettings: string;
  enableAxe: boolean;
  enableWhyDidYouRender: boolean;
  dataUpdateInterval: number;
  enableRevolvingDoor: boolean;
  enableOrganizerFeedback: boolean;
  enableTagDropdown: boolean;
  showAnnouncement: boolean;
}

export const config: Config = {
  // App settings
  MESSAGE_DELAY: 3000, // ms

  // Convention settings
  enableRevolvingDoor: true,
  enableOrganizerFeedback: true,
  enableTagDropdown: true,
  showAnnouncement: false,

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

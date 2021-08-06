export interface Config {
  SIGNUP_END_TIME: number;
  SIGNUP_OPEN_TIME: number;
  MESSAGE_DELAY: number;
  CONVENTION_NAME: ConventionName;
  CONVENTION_YEAR: string;
  CONVENTION_START_TIME: string;
  DAY_START_TIME: number;
  apiServerUrl: string;
  useTestTime: boolean;
  enableReduxTrace: boolean;
  loadedSettings: string;
  enableAxe: boolean;
  enableWhyDidYouRender: boolean;
  dataUpdateInterval: number;
  noSignupGames: string[];
  revolvingDoorEnabled: boolean;
  tagFilteringEnabled: boolean;
  simpleDetails: boolean;
}

type ConventionName = "Ropecon" | "Tracon Hitpoint";

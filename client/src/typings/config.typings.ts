export interface Config {
  SIGNUP_END_TIME: number;
  SIGNUP_OPEN_TIME: number;
  MESSAGE_DELAY: number;
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

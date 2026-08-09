import { Language } from "shared/types/models/programItem";

export interface ClientConfig {
  apiServerUrl: string;
  showTestValues: boolean;
  enableReduxTrace: boolean;
  loadedSettings: string;
  enableAxe: boolean;
  enableWhyDidYouRender: boolean;
  dataUpdateInterval: number;
  appBuildTime: string;
  showAnnouncement: boolean;
  activeLanguages: Language[];
  showAboutPageInProgress: boolean;
}

export const clientConfig: ClientConfig = {
  // Event settings
  showAboutPageInProgress: false,
  showAnnouncement: false,
  activeLanguages: [Language.FINNISH, Language.ENGLISH, Language.SWEDISH],

  // Dev
  enableReduxTrace: false,
  enableAxe: false,
  enableWhyDidYouRender: false,

  // Environment dependent
  loadedSettings: process.env.SETTINGS ?? "development",
  apiServerUrl: process.env.API_SERVER_URL ?? "http://localhost:5000",
  showTestValues: process.env.SHOW_TEST_VALUES === "true" || false,
  // eslint-disable-next-line unicorn/prefer-logical-operator-over-ternary
  dataUpdateInterval: Number(process.env.DATA_UPDATE_INTERVAL)
    ? Number(process.env.DATA_UPDATE_INTERVAL)
    : 60, // seconds
  // Build time baked in at build time, empty when built without one (local
  // dev). The bundle's own git SHA isn't baked in: nothing reads it, because
  // deploys are told apart by which build is newer rather than by identity
  appBuildTime: process.env.APP_BUILD_TIME ?? "",
};

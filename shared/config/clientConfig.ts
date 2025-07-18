import { ActiveProgramType } from "shared/config/clientConfigTypes";
import { Language, ProgramType } from "shared/types/models/programItem";

export interface ClientConfig {
  apiServerUrl: string;
  showTestValues: boolean;
  enableReduxTrace: boolean;
  loadedSettings: string;
  enableAxe: boolean;
  enableWhyDidYouRender: boolean;
  dataUpdateInterval: number;
  enableOrganizerFeedback: boolean;
  enableTagDropdown: boolean;
  showAnnouncement: boolean;
  programTypeSelectOptions: ActiveProgramType[];
  activeLanguages: Language[];
  showAboutPageInProgress: boolean;
}

export const clientConfig: ClientConfig = {
  // Event settings
  enableOrganizerFeedback: true,
  enableTagDropdown: true,
  showAboutPageInProgress: false,
  showAnnouncement: false,
  programTypeSelectOptions: [
    "all",
    ProgramType.TABLETOP_RPG,
    ProgramType.LARP,
    ProgramType.WORKSHOP,
    ProgramType.TOURNAMENT,
    ProgramType.OTHER,
  ],
  activeLanguages: [Language.FINNISH, Language.ENGLISH],

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
};

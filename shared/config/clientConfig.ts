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
  enableRevolvingDoor: boolean;
  enableOrganizerFeedback: boolean;
  enableTagDropdown: boolean;
  showAnnouncement: boolean;
  programTypeSelectOptions: ActiveProgramType[];
  activeLanguages: Language[];
}

export const clientConfig: ClientConfig = {
  // Convention settings
  enableRevolvingDoor: false,
  enableOrganizerFeedback: true,
  enableTagDropdown: true,
  showAnnouncement: false,
  programTypeSelectOptions: [
    "all",
    ProgramType.TABLETOP_RPG,
    ProgramType.LARP,
    ProgramType.FLEAMARKET,
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
  dataUpdateInterval: Number(process.env.DATA_UPDATE_INTERVAL)
    ? Number(process.env.DATA_UPDATE_INTERVAL)
    : 60, // seconds
};

import { ActiveProgramType } from "shared/config/clientConfigTypes";
import { Language, ProgramType } from "shared/types/models/game";

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
  activeProgramTypes: ActiveProgramType[];
  activeLanguages: Language[];
}

export const clientConfig: ClientConfig = {
  // Convention settings
  enableRevolvingDoor: false,
  enableOrganizerFeedback: true,
  enableTagDropdown: false,
  showAnnouncement: false,
  activeProgramTypes: [
    "all",
    ProgramType.LARP,
    ProgramType.WORKSHOP,
    ProgramType.ROUNDTABLE_DISCUSSION,
  ],
  activeLanguages: [Language.ENGLISH],

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

import { ActiveProgramType } from "shared/config/clientConfigTypes";
import { ProgramType } from "shared/typings/models/game";

export interface ClientConfig {
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
  activeProgramTypes: ActiveProgramType[];
}

export const clientConfig: ClientConfig = {
  // App settings
  MESSAGE_DELAY: 3000, // ms

  // Convention settings
  enableRevolvingDoor: false,
  enableOrganizerFeedback: true,
  enableTagDropdown: true,
  showAnnouncement: false,
  activeProgramTypes: ["all", ProgramType.TABLETOP_RPG, ProgramType.LARP],

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

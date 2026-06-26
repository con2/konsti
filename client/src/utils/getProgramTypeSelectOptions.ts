import { config } from "shared/config";
import { ActiveProgramType } from "shared/config/clientConfigTypes";

// Program type options for the UI selector: "all" plus the event's active program types
export const getProgramTypeSelectOptions = (): ActiveProgramType[] => [
  "all",
  ...config.event().activeProgramTypes,
];

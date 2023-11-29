declare module "eventassigner-js" {
  import {
    PadgInput,
    PadgRandomAssignResults,
    PadgError,
  } from "server/types/padgRandomAssignTypes";
  const defaultImport: {
    eventAssignment: (input: PadgInput) => PadgRandomAssignResults | PadgError;
  };
  export = defaultImport;
}

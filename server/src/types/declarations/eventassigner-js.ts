declare module "eventassigner-js" {
  import {
    PadgInput,
    PadgRandomAssignResult,
    PadgError,
  } from "server/types/assignmentTypes";
  const defaultImport: {
    eventAssignment: (input: PadgInput) => PadgRandomAssignResult[] | PadgError;
  };
  export = defaultImport;
}

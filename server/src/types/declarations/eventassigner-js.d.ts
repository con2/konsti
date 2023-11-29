declare module "eventassigner-js" {
  import {
    Input,
    PadgAssignResults,
  } from "server/types/padgRandomAssignTypes";
  const defaultImport: { eventAssignment: (input: Input) => PadgAssignResults };
  export = defaultImport;
}

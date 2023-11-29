declare module "eventassigner-js" {
  import {
    Input,
    PadgAssignResults,
  } from "server/typings/padgRandomAssignTypes";
  const defaultImport: { eventAssignment: (input: Input) => PadgAssignResults };
  export = defaultImport;
}

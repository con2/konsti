declare module "eventassigner-js" {
  import {
    Input,
    PadgAssignResults,
  } from "server/typings/padgRandomAssign.typings";
  const defaultImport: { eventAssignment: (input: Input) => PadgAssignResults };
  export = defaultImport;
}

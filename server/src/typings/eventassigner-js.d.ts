declare module 'eventassigner-js' {
  import { Input, PadgAssignResults } from 'typings/padgAssign.typings';
  const defaultImport: { eventAssignment: (input: Input) => PadgAssignResults };
  export = defaultImport;
}

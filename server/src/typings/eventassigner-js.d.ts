declare module 'eventassigner-js' {
  import { Input, PadgAssignResults } from 'server/typings/padgAssign.typings';
  const defaultImport: { eventAssignment: (input: Input) => PadgAssignResults };
  export = defaultImport;
}

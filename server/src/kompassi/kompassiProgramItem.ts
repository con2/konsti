import {
  KompassiProgramItemHitpoint,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  KompassiProgramItemSchemaHitpoint,
} from "server/kompassi/hitpoint/kompassiProgramItemHitpoint";
import {
  KompassiProgramItemRopecon,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  KompassiProgramItemSchemaRopecon,
} from "server/kompassi/ropecon/kompassiProgramItemRopecon";
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  KompassiProgramItemSchemaSolmukohta,
  KompassiProgramItemSolmukohta,
} from "server/kompassi/solmukohta/kompassiProgramItemSolmukohta";

export type KompassiProgramItem =
  | KompassiProgramItemRopecon
  | KompassiProgramItemHitpoint
  | KompassiProgramItemSolmukohta;

export type KompassiProgramItemSchema =
  | typeof KompassiProgramItemSchemaRopecon
  | typeof KompassiProgramItemSchemaHitpoint
  | typeof KompassiProgramItemSchemaSolmukohta;

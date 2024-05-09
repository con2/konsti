import {
  kompassiProgramItemHitpoint,
  KompassiProgramItemSchemaHitpoint,
} from "server/kompassi/hitpoint/kompassiProgramItemHitpoint";
import {
  KompassiProgramItemRopecon,
  KompassiProgramItemSchemaRopecon,
} from "server/kompassi/ropecon/kompassiProgramItemRopecon";
import {
  KompassiProgramItemSchemaSolmukohta,
  KompassiProgramItemSolmukohta,
} from "server/kompassi/solmukohta/kompassiProgramItemSolmukohta";

export type kompassiProgramItem =
  | KompassiProgramItemRopecon
  | kompassiProgramItemHitpoint
  | KompassiProgramItemSolmukohta;

export type KompassiProgramItemSchema =
  | typeof KompassiProgramItemSchemaRopecon
  | typeof KompassiProgramItemSchemaHitpoint
  | typeof KompassiProgramItemSchemaSolmukohta;

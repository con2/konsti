import {
  KompassiProgramItemHitpoint,
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

export type KompassiProgramItem =
  | KompassiProgramItemRopecon
  | KompassiProgramItemHitpoint
  | KompassiProgramItemSolmukohta;

export type KompassiProgramItemSchema =
  | typeof KompassiProgramItemSchemaRopecon
  | typeof KompassiProgramItemSchemaHitpoint
  | typeof KompassiProgramItemSchemaSolmukohta;

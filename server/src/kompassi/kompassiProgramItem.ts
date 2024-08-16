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
import {
  KompassiProgramItemSchemaTracon,
  KompassiProgramItemTracon,
} from "server/kompassi/tracon/kompassiProgramItemTracon";

export type KompassiProgramItem =
  | KompassiProgramItemRopecon
  | KompassiProgramItemHitpoint
  | KompassiProgramItemSolmukohta
  | KompassiProgramItemTracon;

export type KompassiProgramItemSchema =
  | typeof KompassiProgramItemSchemaRopecon
  | typeof KompassiProgramItemSchemaHitpoint
  | typeof KompassiProgramItemSchemaSolmukohta
  | typeof KompassiProgramItemSchemaTracon;

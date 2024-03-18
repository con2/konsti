import {
  KompassiGameHitpoint,
  KompassiGameSchemaHitpoint,
} from "server/kompassi/hitpoint/kompassiGameHitpoint";
import {
  KompassiGameRopecon,
  KompassiGameSchemaRopecon,
} from "server/kompassi/ropecon/kompassiGameRopecon";
import {
  KompassiGameSchemaSolmukohta,
  KompassiGameSolmukohta,
} from "server/kompassi/solmukohta/kompassiGameSolmukohta";

export type KompassiGame =
  | KompassiGameRopecon
  | KompassiGameHitpoint
  | KompassiGameSolmukohta;

export type KompassiGameSchema =
  | typeof KompassiGameSchemaRopecon
  | typeof KompassiGameSchemaHitpoint
  | typeof KompassiGameSchemaSolmukohta;

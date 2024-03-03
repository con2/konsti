import {
  KompassiGameHitpoint,
  KompassiGameSchemaHitpoint,
} from "server/kompassi/hitpoint/kompassiGameHitpoint";
import {
  KompassiGameRopecon,
  KompassiGameSchemaRopecon,
} from "server/kompassi/ropecon/kompassiGameRopecon";

export type KompassiGame = KompassiGameRopecon | KompassiGameHitpoint;

export type KompassiGameSchema =
  | typeof KompassiGameSchemaRopecon
  | typeof KompassiGameSchemaHitpoint;

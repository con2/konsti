import { getGamesFromFullProgramHitpoint } from "server/features/game/utils/getGamesFromKompassiHitpoint";
import { getGamesFromFullProgramRopecon } from "server/features/game/utils/getGamesFromKompassiRopecon";
import { ConventionName } from "shared/config/sharedConfigTypes";
import {
  KompassiGameHitpoint,
  KompassiGameSchemaHitpoint,
} from "shared/types/models/kompassiGame/kompassiGameHitpoint";
import {
  KompassiGameRopecon,
  KompassiGameSchemaRopecon,
} from "shared/types/models/kompassiGame/kompassiGameRopecon";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

export type KompassiGame = KompassiGameRopecon | KompassiGameHitpoint;

export type KompassiGameSchema =
  | typeof KompassiGameSchemaRopecon
  | typeof KompassiGameSchemaHitpoint;

export const getGamesFromFullProgram = (
  conventionName: ConventionName,
  eventProgramItems: KompassiGame[],
): KompassiGame[] => {
  switch (conventionName) {
    case ConventionName.ROPECON:
      return getGamesFromFullProgramRopecon(
        eventProgramItems as KompassiGameRopecon[],
      );
    case ConventionName.HITPOINT:
      return getGamesFromFullProgramHitpoint(
        eventProgramItems as KompassiGameHitpoint[],
      );
    case ConventionName.SOLMUKOHTA:
      return getGamesFromFullProgramHitpoint(
        eventProgramItems as KompassiGameHitpoint[],
      );
    default:
      exhaustiveSwitchGuard(conventionName);
  }

  return [];
};

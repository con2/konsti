import { getGamesFromFullProgramHitpoint } from "server/kompassi/hitpoint/getGamesFromFullProgramHitpoint";
import { getGamesFromFullProgramRopecon } from "server/kompassi/ropecon/getGamesFromFullProgramRopecon";
import { ConventionName } from "shared/config/sharedConfigTypes";
import { KompassiGameHitpoint } from "server/kompassi/hitpoint/kompassiGameHitpoint";
import { KompassiGameRopecon } from "server/kompassi/ropecon/kompassiGameRopecon";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { KompassiGame } from "server/kompassi/kompassiGame";

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
      return exhaustiveSwitchGuard(conventionName);
  }
};

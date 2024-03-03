import { kompassiGameMapperHitpoint } from "server/kompassi/hitpoint/kompassiGameMapperHitpoint";
import { kompassiGameMapperRopecon } from "server/kompassi/ropecon/kompassiGameMapperRopecon";
import { ConventionName } from "shared/config/sharedConfigTypes";
import { Game } from "shared/types/models/game";
import { KompassiGame } from "server/kompassi/kompassiGame";
import { KompassiGameHitpoint } from "server/kompassi/hitpoint/kompassiGameHitpoint";
import { KompassiGameRopecon } from "server/kompassi/ropecon/kompassiGameRopecon";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

export const kompassiGameMapper = (
  conventionName: ConventionName,
  eventProgramItems: KompassiGame[],
): readonly Game[] => {
  switch (conventionName) {
    case ConventionName.ROPECON:
      return kompassiGameMapperRopecon(
        eventProgramItems as KompassiGameRopecon[],
      );
    case ConventionName.HITPOINT:
      return kompassiGameMapperHitpoint(
        eventProgramItems as KompassiGameHitpoint[],
      );
    case ConventionName.SOLMUKOHTA:
      return kompassiGameMapperHitpoint(
        eventProgramItems as KompassiGameHitpoint[],
      );
    default:
      return exhaustiveSwitchGuard(conventionName);
  }
};

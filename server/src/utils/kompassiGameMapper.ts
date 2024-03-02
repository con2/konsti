import { kompassiGameMapperHitpoint } from "server/utils/kompassiGameMapperHitpoint";
import { kompassiGameMapperRopecon } from "server/utils/kompassiGameMapperRopecon";
import { ConventionName } from "shared/config/sharedConfigTypes";
import { Game } from "shared/types/models/game";
import { KompassiGame } from "shared/types/models/kompassiGame/kompassiGame";
import { KompassiGameHitpoint } from "shared/types/models/kompassiGame/kompassiGameHitpoint";
import { KompassiGameRopecon } from "shared/types/models/kompassiGame/kompassiGameRopecon";
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
      exhaustiveSwitchGuard(conventionName);
  }

  return [];
};

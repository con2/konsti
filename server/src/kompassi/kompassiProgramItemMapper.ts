import { kompassiProgramItemMapperHitpoint } from "server/kompassi/hitpoint/kompassiProgramItemMapperHitpoint";
import { kompassiProgramItemMapperRopecon } from "server/kompassi/ropecon/kompassiProgramItemMapperRopecon";
import { kompassiProgramItemMapperSolmukohta } from "server/kompassi/solmukohta/kompassiProgramItemMapperSolmukohta";
import { kompassiProgramItemMapperTracon } from "server/kompassi/tracon/kompassiProgramItemMapperTracon";
import { ConventionName } from "shared/config/eventConfigTypes";
import { ProgramItem } from "shared/types/models/programItem";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";
import { KompassiProgramItemHitpoint } from "server/kompassi/hitpoint/kompassiProgramItemHitpoint";
import { KompassiProgramItemRopecon } from "server/kompassi/ropecon/kompassiProgramItemRopecon";
import { KompassiProgramItemSolmukohta } from "server/kompassi/solmukohta/kompassiProgramItemSolmukohta";
import { KompassiProgramItemTracon } from "server/kompassi/tracon/kompassiProgramItemTracon";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

export const kompassiProgramItemMapper = (
  conventionName: ConventionName,
  eventProgramItems: KompassiProgramItem[],
): readonly ProgramItem[] => {
  switch (conventionName) {
    case ConventionName.ROPECON:
      return kompassiProgramItemMapperRopecon(
        eventProgramItems as KompassiProgramItemRopecon[],
      );
    case ConventionName.HITPOINT:
      return kompassiProgramItemMapperHitpoint(
        eventProgramItems as KompassiProgramItemHitpoint[],
      );
    case ConventionName.SOLMUKOHTA:
      return kompassiProgramItemMapperSolmukohta(
        eventProgramItems as KompassiProgramItemSolmukohta[],
      );
    case ConventionName.TRACON:
      return kompassiProgramItemMapperTracon(
        eventProgramItems as KompassiProgramItemTracon[],
      );
    default:
      return exhaustiveSwitchGuard(conventionName);
  }
};

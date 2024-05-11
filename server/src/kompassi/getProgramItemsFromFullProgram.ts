import { getProgramItemsFromFullProgramHitpoint } from "server/kompassi/hitpoint/getProgramItemsFromFullProgramHitpoint";
import { getProgramItemsFromFullProgramRopecon } from "server/kompassi/ropecon/getProgramItemsFromFullProgramRopecon";
import { getProgramItemsFromFullProgramSolmukohta } from "server/kompassi/solmukohta/getProgramItemsFromFullProgramSolmukohta";
import { ConventionName } from "shared/config/sharedConfigTypes";
import { kompassiProgramItemHitpoint } from "server/kompassi/hitpoint/kompassiProgramItemHitpoint";
import { KompassiProgramItemRopecon } from "server/kompassi/ropecon/kompassiProgramItemRopecon";
import { KompassiProgramItemSolmukohta } from "server/kompassi/solmukohta/kompassiProgramItemSolmukohta";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { kompassiProgramItem } from "server/kompassi/kompassiProgramItem";

export const getProgramItemsFromFullProgram = (
  conventionName: ConventionName,
  eventProgramItems: kompassiProgramItem[],
): kompassiProgramItem[] => {
  switch (conventionName) {
    case ConventionName.ROPECON:
      return getProgramItemsFromFullProgramRopecon(
        eventProgramItems as KompassiProgramItemRopecon[],
      );
    case ConventionName.HITPOINT:
      return getProgramItemsFromFullProgramHitpoint(
        eventProgramItems as kompassiProgramItemHitpoint[],
      );
    case ConventionName.SOLMUKOHTA:
      return getProgramItemsFromFullProgramSolmukohta(
        eventProgramItems as KompassiProgramItemSolmukohta[],
      );
    default:
      return exhaustiveSwitchGuard(conventionName);
  }
};

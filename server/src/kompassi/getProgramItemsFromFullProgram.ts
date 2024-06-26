import { getProgramItemsFromFullProgramHitpoint } from "server/kompassi/hitpoint/getProgramItemsFromFullProgramHitpoint";
import { getProgramItemsFromFullProgramRopecon } from "server/kompassi/ropecon/getProgramItemsFromFullProgramRopecon";
import { getProgramItemsFromFullProgramSolmukohta } from "server/kompassi/solmukohta/getProgramItemsFromFullProgramSolmukohta";
import { ConventionName } from "shared/config/sharedConfigTypes";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";

export const getProgramItemsFromFullProgram = (
  conventionName: ConventionName,
  eventProgramItems: unknown[],
): KompassiProgramItem[] => {
  switch (conventionName) {
    case ConventionName.ROPECON:
      return getProgramItemsFromFullProgramRopecon(eventProgramItems);
    case ConventionName.HITPOINT:
      return getProgramItemsFromFullProgramHitpoint(eventProgramItems);
    case ConventionName.SOLMUKOHTA:
      return getProgramItemsFromFullProgramSolmukohta(eventProgramItems);
    default:
      return exhaustiveSwitchGuard(conventionName);
  }
};

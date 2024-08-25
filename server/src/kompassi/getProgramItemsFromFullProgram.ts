import { getProgramItemsFromFullProgramHitpoint } from "server/kompassi/hitpoint/getProgramItemsFromFullProgramHitpoint";
import { getProgramItemsFromFullProgramRopecon } from "server/kompassi/ropecon/getProgramItemsFromFullProgramRopecon";
import { getProgramItemsFromFullProgramSolmukohta } from "server/kompassi/solmukohta/getProgramItemsFromFullProgramSolmukohta";
import { getProgramItemsFromFullProgramTracon } from "server/kompassi/tracon/getProgramItemsFromFullProgramTracon";
import { EventName } from "shared/config/eventConfigTypes";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";

export const getProgramItemsFromFullProgram = (
  eventName: EventName,
  eventProgramItems: unknown[],
): KompassiProgramItem[] => {
  switch (eventName) {
    case EventName.ROPECON:
      return getProgramItemsFromFullProgramRopecon(eventProgramItems);
    case EventName.HITPOINT:
      return getProgramItemsFromFullProgramHitpoint(eventProgramItems);
    case EventName.SOLMUKOHTA:
      return getProgramItemsFromFullProgramSolmukohta(eventProgramItems);
    case EventName.TRACON:
      return getProgramItemsFromFullProgramTracon(eventProgramItems);
    default:
      return exhaustiveSwitchGuard(eventName);
  }
};

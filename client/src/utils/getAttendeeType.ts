import { ActiveProgramType } from "shared/config/clientConfigTypes";
import { ProgramType } from "shared/types/models/programItem";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

enum AttendeeType {
  Player = "player",
  Participant = "participant",
}

export const getAttendeeType = (
  activeProgramType: ActiveProgramType,
): AttendeeType => {
  switch (activeProgramType) {
    case ProgramType.TABLETOP_RPG:
    case ProgramType.LARP:
    case ProgramType.EXPERIENCE_POINT:
    case "all":
      return AttendeeType.Player;

    case ProgramType.TOURNAMENT:
    case ProgramType.WORKSHOP:
    case ProgramType.OTHER:
    case ProgramType.ROUNDTABLE_DISCUSSION:
    case ProgramType.FLEAMARKET:
      return AttendeeType.Participant;

    default:
      return exhaustiveSwitchGuard(activeProgramType);
  }
};

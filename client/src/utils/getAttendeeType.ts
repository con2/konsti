import { ProgramType } from "shared/types/models/programItem";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

enum AttendeeType {
  Player = "player",
  Participant = "participant",
}

export const getAttendeeType = (programType: ProgramType): AttendeeType => {
  switch (programType) {
    case ProgramType.TABLETOP_RPG:
    case ProgramType.LARP:
    case ProgramType.EXPERIENCE_POINT:
    case ProgramType.OTHER_GAMING:
      return AttendeeType.Player;

    case ProgramType.TOURNAMENT:
    case ProgramType.WORKSHOP:
    case ProgramType.OTHER:
    case ProgramType.ROUNDTABLE_DISCUSSION:
    case ProgramType.FLEAMARKET:
      return AttendeeType.Participant;

    default:
      return exhaustiveSwitchGuard(programType);
  }
};

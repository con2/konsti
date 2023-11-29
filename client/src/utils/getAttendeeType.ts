import { ActiveProgramType } from "shared/config/clientConfigTypes";
import { ProgramType } from "shared/types/models/game";

enum AttendeeType {
  Player = "player",
  Participant = "participant",
}

const attendeeTypeParticipant = [
  ProgramType.TOURNAMENT,
  ProgramType.WORKSHOP,
  ProgramType.OTHER,
];

export const getAttendeeType = (
  activeProgramType: ActiveProgramType,
): AttendeeType => {
  if (activeProgramType === "all") {
    return AttendeeType.Player;
  }
  if (attendeeTypeParticipant.includes(activeProgramType)) {
    return AttendeeType.Participant;
  }
  return AttendeeType.Player;
};

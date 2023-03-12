import { ProgramType } from "shared/typings/models/game";

enum AttendeeType {
  Player = "player",
  Participant = "participant",
}

export const getAttendeeType = (programType: ProgramType): AttendeeType => {
  if (programType === ProgramType.WORKSHOP) {
    return AttendeeType.Participant;
  }
  return AttendeeType.Player;
};

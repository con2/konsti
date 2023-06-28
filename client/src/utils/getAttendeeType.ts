import { ProgramType } from "shared/typings/models/game";

enum AttendeeType {
  Player = "player",
  Participant = "participant",
}

const attendeeTypeParticipant = [
  ProgramType.TOURNAMENT,
  ProgramType.WORKSHOP,
  ProgramType.OTHER,
];

export const getAttendeeType = (programType: ProgramType): AttendeeType => {
  if (attendeeTypeParticipant.includes(programType)) {
    return AttendeeType.Participant;
  }
  return AttendeeType.Player;
};

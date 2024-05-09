import { ProgramItem, ProgramType } from "shared/types/models/programItem";

export const isRevolvingDoorWorkshop = (game: ProgramItem): boolean => {
  return game.programType === ProgramType.WORKSHOP && game.revolvingDoor;
};

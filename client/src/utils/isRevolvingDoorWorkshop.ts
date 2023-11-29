import { Game, ProgramType } from "shared/types/models/game";

export const isRevolvingDoorWorkshop = (game: Game): boolean => {
  return game.programType === ProgramType.WORKSHOP && game.revolvingDoor;
};

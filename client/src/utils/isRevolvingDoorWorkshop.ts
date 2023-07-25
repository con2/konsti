import { Game, ProgramType } from "shared/typings/models/game";

export const isRevolvingDoorWorkshop = (game: Game): boolean => {
  return game.programType === ProgramType.WORKSHOP && game.revolvingDoor;
};

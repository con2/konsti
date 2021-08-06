import { Game } from "shared/typings/models/game";

export interface DnDUpdatedPositions {
  availableGames?: readonly Game[];
  selectedGames?: readonly Game[];
}

export interface DnDMove {
  index: number;
  droppableId: string;
}

import _ from 'lodash';
import { moveArrayItem, insertByIndex } from 'client/utils/array';
import { DnDUpdatedPositions, DnDMove } from 'client/typings/game.typings';
import { Game } from 'shared/typings/models/game';

export const reorder = (
  list: readonly Game[],
  startIndex: number,
  endIndex: number
): readonly Game[] => {
  return moveArrayItem(list, startIndex, endIndex);
};

export const move = (
  sourceList: readonly Game[],
  destinationList: readonly Game[],
  sourceMove: DnDMove,
  destinationMove: DnDMove
): DnDUpdatedPositions => {
  return {
    [sourceMove.droppableId]: _.without(
      sourceList,
      sourceList[sourceMove.index]
    ),

    [destinationMove.droppableId]: insertByIndex(
      destinationList,
      sourceList[sourceMove.index],
      destinationMove.index
    ),
  };
};

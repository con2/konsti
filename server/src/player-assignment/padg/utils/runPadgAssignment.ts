import { assignPadg } from 'player-assignment/padg/utils/assignPadg';
import { getGroups } from 'player-assignment/padg/utils/getGroups';
import { getList } from 'player-assignment/padg/utils/getList';
import { getEvents } from 'player-assignment/padg/utils/getEvents';
import { formatResults } from 'player-assignment/padg/utils/formatResults';
import { AssignmentStrategyResult } from 'typings/result.typings';
import { UserArray } from 'typings/user.typings';
import { Game } from 'typings/game.typings';

export const runPadgAssignment = (
  signedGames: readonly Game[],
  playerGroups: readonly UserArray[],
  startingTime: string
): AssignmentStrategyResult => {
  interface Input {
    list: string;
  }

  const groups = getGroups(playerGroups, startingTime);
  const events = getEvents(signedGames);
  const list = getList(playerGroups, startingTime);
  const updateL = (input: Input): string => input.list;

  const assignResults = assignPadg(groups, events, list, updateL);

  if (!assignResults) {
    throw new Error('Padg assignment error');
  }

  const results = formatResults(assignResults, playerGroups);

  const message = 'Padg assignment completed';

  return { results, message };
};

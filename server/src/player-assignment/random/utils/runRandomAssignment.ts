import { eventAssignment } from 'eventassigner-random';
import { CheckResult } from 'eventassigner-random/lib/typings/checkResult';
import { config } from 'server/config';
import { getGroups } from 'server/player-assignment/utils/getGroups';
import { getList } from 'server/player-assignment/utils/getList';
import { getRandomAssignEvents } from 'server/player-assignment/utils/getRandomAssignEvents';
import { formatResults } from 'server/player-assignment/utils/formatResults';
import { UserArray } from 'server/typings/user.typings';
import { Game } from 'shared/typings/game';
import { AssignmentStrategyResult } from 'server/typings/result.typings';
import {
  ListItem,
  RandomAssignUpdateLInput,
  PadgRandomAssignResults,
} from 'server/typings/padgRandomAssign.typings';

export const runRandomAssignment = (
  signedGames: readonly Game[],
  playerGroups: readonly UserArray[],
  startingTime: string
): AssignmentStrategyResult => {
  const groups = getGroups(playerGroups, startingTime);
  const events = getRandomAssignEvents(signedGames);
  const list = getList(playerGroups, startingTime);
  const updateL = (input: RandomAssignUpdateLInput): ListItem[] => input.L;

  const { RANDOM_ASSIGNMENT_ROUNDS } = config;
  const input = {
    groups,
    events,
    L: list,
    updateL,
    assignmentRounds: RANDOM_ASSIGNMENT_ROUNDS,
  };

  const assignResults = eventAssignment(input);

  if (isCheckResult(assignResults)) {
    throw new Error(`Random assignment error: ${assignResults.msg}`);
  }

  const results = formatResults(assignResults, playerGroups);

  const message = 'Random assignment completed';

  return { results, message };
};

function isCheckResult(
  assignResults: PadgRandomAssignResults | CheckResult
): assignResults is CheckResult {
  return (assignResults as CheckResult).value !== undefined;
}

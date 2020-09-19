import { PlayerIdWithPriority } from 'typings/user.typings';

export const getPriorities = (
  results: readonly number[][],
  signupMatrix: readonly number[][]
): PlayerIdWithPriority[] => {
  // Show the priorities players were assigned to
  const priorities: PlayerIdWithPriority[] = [];
  for (let i = 0; i < results.length; i += 1) {
    const matrixValue = signupMatrix[results[i][0]][results[i][1]];
    const selectedPlayer = results[i][1];
    priorities.push({
      playerId: selectedPlayer,
      priorityValue: matrixValue,
    });
  }
  return priorities;
};

import { assignPadg } from "server/features/player-assignment/padg/utils/assignPadg";
import { getGroups } from "server/features/player-assignment/utils/getGroups";
import { getList } from "server/features/player-assignment/utils/getList";
import { getEvents } from "server/features/player-assignment/utils/getEvents";
import { formatResults } from "server/features/player-assignment/utils/formatResults";
import { AssignmentStrategyResult, Input } from "server/typings/result.typings";
import { Game } from "shared/typings/models/game";
import { User } from "shared/typings/models/user";

export const runPadgAssignment = (
  signedGames: readonly Game[],
  playerGroups: readonly User[][],
  startingTime: string
): AssignmentStrategyResult => {
  const groups = getGroups(playerGroups, startingTime);
  const events = getEvents(signedGames);
  const list = getList(playerGroups, startingTime);
  const updateL = (input: Input): string => input.list;

  const assignResults = assignPadg(groups, events, list, updateL);

  if (!assignResults) {
    throw new Error("Padg assignment error");
  }

  const results = formatResults(assignResults, playerGroups);

  const message = "Padg assignment completed";

  return { results, message };
};

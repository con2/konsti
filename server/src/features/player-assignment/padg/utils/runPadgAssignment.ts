import { assignPadg } from "server/features/player-assignment/padg/utils/assignPadg";
import { getGroups } from "server/features/player-assignment/utils/getGroups";
import { getList } from "server/features/player-assignment/utils/getList";
import { getEvents } from "server/features/player-assignment/utils/getEvents";
import { formatResults } from "server/features/player-assignment/utils/formatResults";
import { AssignmentStrategyResult, Input } from "server/typings/result.typings";
import { Game } from "shared/typings/models/game";
import { User } from "shared/typings/models/user";
import { Signup } from "server/features/signup/signup.typings";

export const runPadgAssignment = (
  signedGames: readonly Game[],
  playerGroups: readonly User[][],
  startingTime: string,
  signups: readonly Signup[]
): AssignmentStrategyResult => {
  const groups = getGroups(playerGroups, startingTime);
  const events = getEvents(signedGames);
  const list = getList(playerGroups, startingTime, signups);
  const updateL = (input: Input): string => input.list;

  const assignResults = assignPadg(groups, events, list, updateL);

  if (!assignResults) {
    throw new Error(
      `Padg assignment failed with input: groups: ${JSON.stringify(
        groups
      )}, events: ${JSON.stringify(events)}, list: ${JSON.stringify(
        list
      )}, updateL: ${updateL}`
    );
  }

  const results = formatResults(assignResults, playerGroups);

  const message = "Padg assignment completed";

  return { results, message };
};

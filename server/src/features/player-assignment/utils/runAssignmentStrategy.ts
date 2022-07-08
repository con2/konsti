import { logger } from "server/utils/logger";
import { groupAssignPlayers } from "server/features/player-assignment/group/groupAssignPlayers";
import { munkresAssignPlayers } from "server/features/player-assignment/munkres/munkresAssignPlayers";
import { padgAssignPlayers } from "server/features/player-assignment/padg/padgAssignPlayers";
import { randomAssignPlayers } from "server/features/player-assignment/random/randomAssignPlayers";
import { User } from "shared/typings/models/user";
import { Game } from "shared/typings/models/game";
import { PlayerAssignmentResult } from "server/typings/result.typings";
import { AssignmentStrategy } from "shared/config/sharedConfig.types";
import { Signup } from "server/features/signup/signup.typings";

export const runAssignmentStrategy = (
  players: readonly User[],
  games: readonly Game[],
  startingTime: string,
  assignmentStrategy: AssignmentStrategy,
  signups: readonly Signup[]
): PlayerAssignmentResult => {
  logger.info(
    `Received data for ${players.length} players and ${games.length} games`
  );

  logger.info(
    `Assigning players for games starting at ${startingTime.toString()}`
  );

  logger.info(`Assign strategy: ${assignmentStrategy}`);

  if (assignmentStrategy === "munkres") {
    return munkresAssignPlayers(players, games, startingTime);
  } else if (assignmentStrategy === "group") {
    return groupAssignPlayers(players, games, startingTime);
  } else if (assignmentStrategy === "padg") {
    return padgAssignPlayers(players, games, startingTime, signups);
  } else if (assignmentStrategy === "random") {
    return randomAssignPlayers(players, games, startingTime, signups);
  } else if (assignmentStrategy === "group+padg") {
    const groupResult = groupAssignPlayers(players, games, startingTime);
    const padgResult = padgAssignPlayers(players, games, startingTime, signups);

    logger.info(
      `Group result: ${groupResult.results.length} players, Padg result: ${padgResult.results.length} players`
    );

    if (groupResult.results.length > padgResult.results.length) {
      logger.info("----> Use Group Assign result");
      return groupResult;
    } else {
      logger.info("----> Use Padg Assign result");
      return padgResult;
    }
  } else if (assignmentStrategy === "random+padg") {
    const randomResult = randomAssignPlayers(
      players,
      games,
      startingTime,
      signups
    );
    const padgResult = padgAssignPlayers(players, games, startingTime, signups);
    logger.info(
      `Random result: ${randomResult.results.length} players, Padg result: ${padgResult.results.length} players`
    );
    if (randomResult.results.length > padgResult.results.length) {
      logger.info("----> Use Random assign result");
      return randomResult;
    } else {
      logger.info("----> Use Padg Assign result");
      return padgResult;
    }
  } else {
    throw new Error('Invalid or missing "assignmentStrategy" config');
  }
};

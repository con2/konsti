import dayjs from "dayjs";
import _ from "lodash";
import { findGames } from "server/features/game/gameRepository";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import { findUsers } from "server/features/user/userRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { EventLogAction } from "shared/typings/models/eventLog";
import { ProgramType } from "shared/typings/models/game";

export const createEventLogItems = async (): Promise<void> => {
  const gamesResult = await findGames();
  const games = unsafelyUnwrapResult(gamesResult);
  const rpgs = games.filter(
    (game) => game.programType === ProgramType.TABLETOP_RPG,
  );

  const allUsersResult = await findUsers();
  const allUsers = unsafelyUnwrapResult(allUsersResult);

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "helper",
  );

  const eventLogUpdates = users.flatMap((user) => {
    const randomGames = _.sampleSize(rpgs, 5);

    return randomGames.map((randomGame, index) => ({
      username: user.username,
      programItemId: randomGame.gameId,
      programItemStartTime: randomGame.startTime,
      createdAt: createdAtTimes[index].toISOString(),
    }));
  });

  await addEventLogItems({
    updates: eventLogUpdates,
    action: EventLogAction.NEW_ASSIGNMENT,
  });
};

const createdAtTimes = [
  dayjs().subtract(2, "minutes"),
  dayjs().subtract(50, "minutes"),
  dayjs().subtract(2, "hours"),
  dayjs().subtract(5, "hours"),
  dayjs().subtract(8, "hours"),
];

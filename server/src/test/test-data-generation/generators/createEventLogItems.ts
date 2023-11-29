import dayjs from "dayjs";
import _ from "lodash";
import { findGames } from "server/features/game/gameRepository";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import { findUsers } from "server/features/user/userRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { EventLogAction } from "shared/types/models/eventLog";
import { config } from "shared/config";

export const createEventLogItems = async (): Promise<void> => {
  const gamesResult = await findGames();
  const games = unsafelyUnwrapResult(gamesResult);
  const twoPhaseSignups = games.filter((game) =>
    config.shared().twoPhaseSignupProgramTypes.includes(game.programType),
  );

  const allUsersResult = await findUsers();
  const allUsers = unsafelyUnwrapResult(allUsersResult);

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "helper",
  );

  const eventLogUpdates = users.flatMap((user) => {
    const randomGames = _.sampleSize(twoPhaseSignups, 5);

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

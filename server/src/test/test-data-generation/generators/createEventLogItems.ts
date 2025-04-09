import dayjs from "dayjs";
import { sampleSize } from "lodash-es";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import { findUsers } from "server/features/user/userRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { EventLogAction } from "shared/types/models/eventLog";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";

export const createEventLogItems = async (): Promise<void> => {
  const programItems = unsafelyUnwrap(await findProgramItems());
  const twoPhaseSignups = programItems.filter((programItem) =>
    isLotterySignupProgramItem(programItem),
  );

  const allUsers = unsafelyUnwrap(await findUsers());

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "helper",
  );

  const newAssignmentEventLogUpdates = users.flatMap((user) => {
    const randomProgramItems = sampleSize(twoPhaseSignups, 3);

    return randomProgramItems.map((randomProgramItem, index) => ({
      username: user.username,
      programItemId: randomProgramItem.programItemId,
      programItemStartTime: randomProgramItem.startTime,
      createdAt: createdAtTimes[index].toISOString(),
    }));
  });

  await addEventLogItems({
    updates: newAssignmentEventLogUpdates,
    action: EventLogAction.NEW_ASSIGNMENT,
  });

  const noAssignmentEventLogUpdates = users.flatMap((user) => {
    const randomProgramItems = sampleSize(twoPhaseSignups, 2);

    return randomProgramItems.map((randomProgramItem, index) => ({
      username: user.username,
      programItemId: "",
      programItemStartTime: randomProgramItem.startTime,
      createdAt: createdAtTimes[index].toISOString(),
    }));
  });

  await addEventLogItems({
    updates: noAssignmentEventLogUpdates,
    action: EventLogAction.NO_ASSIGNMENT,
  });
};

const createdAtTimes = [
  dayjs().subtract(2, "minutes"),
  dayjs().subtract(50, "minutes"),
  dayjs().subtract(2, "hours"),
  dayjs().subtract(5, "hours"),
  dayjs().subtract(8, "hours"),
];

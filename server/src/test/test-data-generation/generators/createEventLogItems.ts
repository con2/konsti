import { subHours, subMinutes } from "date-fns";
import { first, groupBy, sample } from "remeda";
import { NewEventLogItem } from "shared/types/api/eventLog";
import { EventLogAction } from "shared/types/models/eventLog";
import { getRandomInt } from "server/features/assignment/utils/getRandomInt";
import { saveDirectSignup } from "server/features/direct-signup/directSignupRepository";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import { findUsers } from "server/features/user/userRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

// Simulate lottery results: for each start time a user has lottery sign-ups for,
// they either win a spot (a newAssignment message plus the direct sign-up the
// real assignment would create) or lose (a noAssignment message). This keeps
// the event log consistent with the sign-ups shown in My Program
export const createEventLogItems = async (): Promise<void> => {
  const programItems = unsafelyUnwrap(await findProgramItems());
  const programItemsById = new Map(
    programItems.map((programItem) => [programItem.programItemId, programItem]),
  );

  const allUsers = unsafelyUnwrap(await findUsers());

  const users = allUsers.filter(
    (user) => user.username !== "admin" && user.username !== "helper",
  );

  const newAssignmentEventLogUpdates: NewEventLogItem[] = [];
  const noAssignmentEventLogUpdates: NewEventLogItem[] = [];

  for (const user of users) {
    const signupsBySlot = groupBy(user.lotterySignups, (lotterySignup) =>
      new Date(lotterySignup.signedToStartTime).toISOString(),
    );
    const slots = Object.entries(signupsBySlot).slice(0, createdAtTimes.length);

    for (const [index, [slotStartTime, slotSignups]] of slots.entries()) {
      const createdAt = createdAtTimes[index].toISOString();

      const wonSignup =
        getRandomInt(0, 1) === 1 ? first(sample(slotSignups, 1)) : undefined;
      const wonProgramItem = wonSignup
        ? programItemsById.get(wonSignup.programItemId)
        : undefined;

      if (!wonSignup || !wonProgramItem) {
        noAssignmentEventLogUpdates.push({
          username: user.username,
          programItemId: "",
          programItemStartTime: slotStartTime,
          createdAt,
          action: EventLogAction.NO_ASSIGNMENT,
        });
        continue;
      }

      const saveResult = await saveDirectSignup({
        username: user.username,
        directSignupProgramItemId: wonSignup.programItemId,
        // A spot is held for the hour its attendee turns up, so the program item's own start
        // time rather than the parent time its lottery was batched at
        signedToStartTime: wonProgramItem.startTime,
        signupTime: wonProgramItem.startTime,
        message: "",
        priority: wonSignup.priority,
      });

      // The program item can already be full of earlier winners - the slot is
      // then a loss, so the assignment message never points at a missing sign-up
      const userGotIn =
        saveResult.ok &&
        saveResult.value.userSignups.some(
          (userSignup) => userSignup.username === user.username,
        );
      if (!userGotIn) {
        noAssignmentEventLogUpdates.push({
          username: user.username,
          programItemId: "",
          programItemStartTime: slotStartTime,
          createdAt,
          action: EventLogAction.NO_ASSIGNMENT,
        });
        continue;
      }

      newAssignmentEventLogUpdates.push({
        username: user.username,
        programItemId: wonSignup.programItemId,
        programItemStartTime: wonSignup.signedToStartTime,
        createdAt,
        action: EventLogAction.NEW_ASSIGNMENT,
      });
    }
  }

  await addEventLogItems(newAssignmentEventLogUpdates);
  await addEventLogItems(noAssignmentEventLogUpdates);
};

const createdAtTimes = [
  subMinutes(new Date(), 2),
  subMinutes(new Date(), 50),
  subHours(new Date(), 2),
  subHours(new Date(), 5),
  subHours(new Date(), 8),
];

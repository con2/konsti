import { expect } from "vitest";
import { findUsers } from "server/features/user/userRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { verifyUserSignups } from "server/features/assignment/utils/verifyUserSignups";
import { EventLogAction } from "shared/types/models/eventLog";

export const assertUserUpdatedCorrectly = async (
  usernames: string[],
): Promise<void> => {
  const users = unsafelyUnwrap(await findUsers(usernames));

  users.map((user) => {
    const newAssignmentEventLogItems = user.eventLogItems.filter(
      (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
    );
    expect(newAssignmentEventLogItems).toHaveLength(1);
  });

  await verifyUserSignups();
};

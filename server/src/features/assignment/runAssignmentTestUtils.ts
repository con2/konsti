import { expect } from "vitest";
import { findUsers } from "server/features/user/userRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { verifyUserSignups } from "server/features/assignment/utils/verifyUserSignups";

export const assertUserUpdatedCorrectly = async (
  usernames: string[],
): Promise<void> => {
  const users = unsafelyUnwrap(await findUsers(usernames));

  users.map((user) => {
    expect(user.eventLogItems).toHaveLength(1);
  });

  await verifyUserSignups();
};

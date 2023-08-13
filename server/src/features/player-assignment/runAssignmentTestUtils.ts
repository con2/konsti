import { expect } from "vitest";
import { findUsers } from "server/features/user/userRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { verifyUserSignups } from "server/features/player-assignment/utils/verifyUserSignups";

export const assertUserUpdatedCorrectly = async (
  usernames: string[],
): Promise<void> => {
  const usersResult = await findUsers(usernames);
  const users = unsafelyUnwrapResult(usersResult);

  users.map((user) => {
    expect(user.eventLogItems).toHaveLength(1);
  });

  await verifyUserSignups();
};

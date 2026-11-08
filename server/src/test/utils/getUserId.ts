import { findUser } from "server/features/user/userRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

export const getUserId = async (username: string): Promise<string> => {
  const user = unsafelyUnwrap(await findUser(username));
  if (!user) {
    // eslint-disable-next-line no-restricted-syntax -- Test helper
    throw new Error(`Test user ${username} has not been saved`);
  }
  return user.userId;
};

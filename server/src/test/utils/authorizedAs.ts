import { UserGroup } from "shared/types/models/user";
import { findUser } from "server/features/user/userRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { getJWT } from "server/utils/jwt";

// Supertest's .set() takes a header object, so a request authenticates with .set(await authorizedAs(...)).
// A name with no saved user gets a placeholder userId, so save the user first.
export const authorizedAs = async (
  userGroup: UserGroup,
  username: string,
): Promise<{ Authorization: string }> => {
  const user = unsafelyUnwrap(await findUser(username));
  const userId = user?.userId ?? `test-${username}`;
  const jwt = getJWT(userGroup, { userId, username });
  return { Authorization: `Bearer ${jwt}` };
};

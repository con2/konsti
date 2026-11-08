import { UserGroup } from "shared/types/models/user";
import { getJWT } from "server/utils/jwt";

// Supertest's .set() takes a header object, so a request authenticates with .set(authorizedAs(...))
export const authorizedAs = (
  userGroup: UserGroup,
  username: string,
): { Authorization: string } => {
  const jwt = getJWT(userGroup, { userId: `test-${username}`, username });
  return { Authorization: `Bearer ${jwt}` };
};

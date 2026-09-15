import { UserGroup } from "shared/types/models/user";
import { getJWT } from "server/utils/jwt";

// Supertest's .set() takes a header object, so a request authenticates with .set(authorizedAs(...))
export const authorizedAs = (
  userGroup: UserGroup,
  username: string,
): { Authorization: string } => {
  return { Authorization: `Bearer ${getJWT(userGroup, username)}` };
};

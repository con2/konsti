import { getJwtResponse } from "server/utils/jwt";
import { logger } from "server/utils/logger";
import { UserGroup } from "shared/types/models/user";

export const getAuthorizedUsername = (
  authHeader: string | undefined,
  requiredUserGroup: UserGroup | UserGroup[],
): string | null => {
  logger.debug(`Auth: Require jwt for user group ${String(requiredUserGroup)}`);

  if (!authHeader || authHeader.split(" ")[0] !== "Bearer") {
    logger.info("Auth: No auth header");
    return null;
  }

  // Strip 'bearer' from authHeader
  const jwt = authHeader.split("Bearer ")[1];

  const jwtResponse = getJwtResponse(jwt, requiredUserGroup);

  if (jwtResponse.status === "error") {
    logger.info(
      `Auth: Invalid jwt for user group '${String(requiredUserGroup)}'`,
    );
    return null;
  }

  logger.debug(`Auth: Valid jwt for user group ${String(requiredUserGroup)}`);
  return jwtResponse.body.username;
};

export const getAuthorizedUserGroup = (
  authHeader: string | undefined,
): UserGroup | null => {
  logger.debug("Auth: Get userGroup for user");

  if (!authHeader || authHeader.split(" ")[0] !== "Bearer") {
    return null;
  }

  // Strip 'bearer' from authHeader
  const jwt = authHeader.split("Bearer ")[1];

  // Any userGroup is fine, we want to know what the group is
  const jwtResponse = getJwtResponse(jwt, [
    UserGroup.ADMIN,
    UserGroup.HELP,
    UserGroup.USER,
  ]);

  if (jwtResponse.status === "error") {
    return null;
  }

  return jwtResponse.body.userGroup;
};

import { getJwtResponse } from "server/utils/jwt";
import { logger } from "server/utils/logger";
import { UserGroup } from "shared/types/models/user";

export const getAuthorizedUsername = (
  authHeader: string | undefined,
  requiredUserGroup: UserGroup | UserGroup[],
): string | null => {
  logger.debug(`Auth: Require jwt for user group ${requiredUserGroup}`);

  if (!authHeader || authHeader.split(" ")[0] !== "Bearer") {
    logger.info(`Auth: No auth header`);
    return null;
  }

  // Strip 'bearer' from authHeader
  const jwt = authHeader.split("Bearer ")[1];

  const jwtResponse = getJwtResponse(jwt, requiredUserGroup);

  if (jwtResponse.status === "error") {
    logger.info(`Auth: Invalid jwt for user group ${requiredUserGroup}`);
    return null;
  }

  logger.debug(`Auth: Valid jwt for user group ${requiredUserGroup}`);
  return jwtResponse.body.username;
};

export const authorizeUsingApiKey = (apiKey: string | undefined): boolean => {
  if (process.env.NODE_ENV === "production" && !process.env.API_KEY) {
    return false;
  }
  if (apiKey === process.env.API_KEY) {
    return true;
  }
  return false;
};

import { verifyJWT } from 'server/utils/jwt';
import { logger } from 'server/utils/logger';
import { UserGroup } from 'shared/typings/models/user';

export const isAuthorized = (
  authHeader: string | undefined,
  requiredUserGroup: UserGroup
): boolean => {
  logger.debug(`Auth: Require jwt for user group "${requiredUserGroup}"`);

  if (!authHeader || authHeader.split(' ')[0] !== 'Bearer') {
    logger.info(`Auth: No auth header`);
    return false;
  }

  // Strip 'bearer' from authHeader
  const jwt = authHeader.split('Bearer ')[1];

  const jwtResponse = verifyJWT(jwt, requiredUserGroup);

  if (jwtResponse.status === 'error') {
    logger.info(`Auth: Invalid jwt for user group "${requiredUserGroup}"`);
    return false;
  }

  logger.debug(`Auth: Valid jwt for user group "${requiredUserGroup}" `);
  return true;
};

import { verifyJWT } from 'utils/jwt';
import { logger } from 'utils/logger';
import { UserGroup } from 'typings/user.typings';

export const validateAuthHeader = (
  authHeader: string | undefined,
  userGroup: UserGroup
): boolean => {
  logger.debug(`Auth: Require jwt for user group "${userGroup}"`);
  let jwt = '';

  if (authHeader) {
    // Strip 'bearer' from authHeader
    jwt = authHeader.split('Bearer ')[1];
  } else {
    logger.info(`Auth: No auth header`);
    return false;
  }

  const jwtResponse = verifyJWT(jwt, userGroup);

  if (jwtResponse.status !== 'error') {
    logger.debug(`Auth: Valid jwt for user group "${userGroup}" `);
    return true;
  } else {
    logger.info(`Auth: Invalid jwt for user group "${userGroup}"`);
    return false;
  }
};

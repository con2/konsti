import { logger } from 'server/utils/logger';
import { User, GetGroupReturnValue } from 'server/typings/user.typings';
import { Status } from 'shared/typings/api/games';
import {
  findGroup,
  findGroupMembers,
  findUserSerial,
  saveGroupCode,
} from 'server/db/user/userService';

interface PostGroupResponse {
  message: string;
  status: Status;
  groupCode?: string;
  code?: number;
  error?: Error;
}

interface GetGroupResponse {
  message: string;
  status: Status;
  results?: GetGroupReturnValue[];
  error?: Error;
}

export const postGroup = async (
  username: string,
  leader: boolean,
  groupCode: string,
  ownSerial: string,
  leaveGroup: boolean,
  closeGroup: boolean
): Promise<PostGroupResponse> => {
  logger.info('API call: POST /api/group');

  if (closeGroup) {
    const groupMembers = await findGroupMembers(groupCode);

    try {
      await Promise.all(
        groupMembers.map(async (groupMember) => {
          await saveGroupCode('0', groupMember.username);
        })
      );
    } catch (error) {
      logger.error(`findGroupMembers: ${error}`);
      throw new Error('Error closing group');
    }

    return {
      message: 'Group closed successfully',
      status: 'success',
      groupCode: '0',
    };
  }

  if (leaveGroup) {
    const groupMembers = await findGroupMembers(groupCode);

    if (leader && groupMembers.length > 1) {
      return {
        message: 'Leader cannot leave non-empty group',
        status: 'error',
        code: 36,
      };
    }

    let saveGroupResponse;
    try {
      saveGroupResponse = await saveGroupCode('0', username);
    } catch (error) {
      logger.error(`Failed to leave group: ${error}`);
      return {
        message: 'Failed to leave group',
        status: 'error',
        code: 35,
      };
    }

    if (saveGroupResponse) {
      return {
        message: 'Leave group success',
        status: 'success',
        groupCode: saveGroupResponse.groupCode,
      };
    } else {
      logger.error('Failed to leave group');
      return {
        message: 'Failed to leave group',
        status: 'error',
        code: 35,
      };
    }
  }

  // Create group
  if (leader) {
    // Check that serial is not used
    let findGroupResponse;
    try {
      // Check if group exists
      findGroupResponse = await findGroup(groupCode, username);
    } catch (error) {
      logger.error(`findUser(): ${error}`);
      return {
        message: 'Own group already exists',
        status: 'error',
        code: 34,
      };
    }

    if (findGroupResponse) {
      // Group exists
      return {
        message: 'Own group already exists',
        status: 'error',
        code: 34,
      };
    }

    // No existing group, create
    let saveGroupResponse;
    try {
      saveGroupResponse = await saveGroupCode(groupCode, username);
    } catch (error) {
      logger.error(`saveGroup(): ${error}`);
      return {
        message: 'Save group failure',
        status: 'error',
        error,
        code: 30,
      };
    }

    if (saveGroupResponse) {
      return {
        message: 'Create group success',
        status: 'success',
        groupCode: saveGroupResponse.groupCode,
      };
    } else {
      return {
        message: 'Save group failure',
        status: 'error',
        code: 30,
      };
    }
  }

  // Join group
  if (!leader) {
    // Cannot join own group
    if (ownSerial === groupCode) {
      return {
        message: 'Cannot join own group',
        status: 'error',
        code: 33,
      };
    }

    // Check if code is valid
    let findSerialResponse;
    try {
      findSerialResponse = await findUserSerial({ serial: groupCode });
    } catch (error) {
      logger.error(`findSerial(): ${error}`);
      return {
        message: 'Error finding serial',
        status: 'error',
        code: 31,
      };
    }

    // Code is valid
    if (!findSerialResponse) {
      return {
        message: 'Invalid group code',
        status: 'error',
        code: 31,
      };
    }

    // Check if group leader has created a group
    let findGroupResponse;
    try {
      const leaderUsername = findSerialResponse.username;
      findGroupResponse = await findGroup(groupCode, leaderUsername);
    } catch (error) {
      logger.error(`findGroup(): ${error}`);
      return {
        message: 'Error finding group',
        status: 'error',
        code: 32,
      };
    }

    // No existing group, cannot join
    if (!findGroupResponse) {
      return {
        message: 'Group does not exist',
        status: 'error',
        code: 32,
      };
    }

    // Group exists, join
    let saveGroupResponse;
    try {
      saveGroupResponse = await saveGroupCode(groupCode, username);
    } catch (error) {
      logger.error(`saveGroup(): ${error}`);
      return {
        message: 'Error saving group',
        status: 'error',
        code: 30,
      };
    }

    if (saveGroupResponse) {
      return {
        message: 'Joined to group success',
        status: 'success',
        groupCode: saveGroupResponse.groupCode,
      };
    } else {
      logger.error('Failed to sign to group');
      return {
        message: 'Failed to update group',
        status: 'error',
        code: 30,
      };
    }
  }

  return {
    message: 'Unknown error',
    status: 'error',
  };
};

// Get group members
export const getGroup = async (
  groupCode: string
): Promise<GetGroupResponse> => {
  logger.info('API call: GET /api/group');

  let findGroupResults: User[];
  try {
    findGroupResults = await findGroupMembers(groupCode);

    const returnData: GetGroupReturnValue[] = [];
    for (const findGroupResult of findGroupResults) {
      returnData.push({
        groupCode: findGroupResult.groupCode,
        signedGames: findGroupResult.signedGames,
        enteredGames: findGroupResult.enteredGames,
        serial: findGroupResult.serial,
        username: findGroupResult.username,
      });
    }

    return {
      message: 'Getting group members success',
      status: 'success',
      results: returnData,
    };
  } catch (error) {
    logger.error(`Results: ${error}`);
    return {
      message: 'Getting group members failed',
      status: 'error',
      error,
    };
  }
};

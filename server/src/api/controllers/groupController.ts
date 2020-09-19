import { Record, String } from 'runtypes';
import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { validateAuthHeader } from 'utils/authHeader';
import { Request, Response } from 'express';
import { UserGroup, User, GetGroupReturValue } from 'typings/user.typings';

const postGroup = async (req: Request, res: Response): Promise<unknown> => {
  logger.info('API call: POST /api/group');

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const groupData = req.body.groupData;
  const {
    username,
    leader,
    groupCode,
    ownSerial,
    leaveGroup,
    closeGroup,
  } = groupData;

  if (closeGroup) {
    const groupMembers = await db.user.findGroupMembers(groupCode);

    try {
      await Promise.all(
        groupMembers.map(async (groupMember) => {
          await db.user.saveGroupCode('0', groupMember.username);
        })
      );
    } catch (error) {
      logger.error(`db.user.findGroupMembers: ${error}`);
      throw new Error('Error closing group');
    }

    return res.json({
      message: 'Group closed successfully',
      status: 'success',
      groupCode: '0',
    });
  }

  if (leaveGroup) {
    const groupMembers = await db.user.findGroupMembers(groupCode);

    if (leader && groupMembers.length > 1) {
      return res.json({
        message: 'Leader cannot leave non-empty group',
        status: 'error',
        code: 36,
      });
    }

    let saveGroupResponse;
    try {
      saveGroupResponse = await db.user.saveGroupCode('0', username);
    } catch (error) {
      logger.error(`Failed to leave group: ${error}`);
      return res.json({
        message: 'Failed to leave group',
        status: 'error',
        code: 35,
      });
    }

    if (saveGroupResponse) {
      return res.json({
        message: 'Leave group success',
        status: 'success',
        groupCode: saveGroupResponse.groupCode,
      });
    } else {
      logger.error('Failed to leave group');
      return res.json({
        message: 'Failed to leave group',
        status: 'error',
        code: 35,
      });
    }
  }

  // Create group
  if (leader) {
    // Check that serial is not used
    let findGroupResponse;
    try {
      // Check if group exists
      findGroupResponse = await db.user.findGroup(groupCode, username);
    } catch (error) {
      logger.error(`db.user.findUser(): ${error}`);
      return res.json({
        message: 'Own group already exists',
        status: 'error',
        code: 34,
      });
    }

    if (findGroupResponse) {
      // Group exists
      return res.json({
        message: 'Own group already exists',
        status: 'error',
        code: 34,
      });
    }

    // No existing group, create
    let saveGroupResponse;
    try {
      saveGroupResponse = await db.user.saveGroupCode(groupCode, username);
    } catch (error) {
      logger.error(`db.user.saveGroup(): ${error}`);
      return res.json({
        message: 'Save group failure',
        status: 'error',
        error,
        code: 30,
      });
    }

    if (saveGroupResponse) {
      return res.json({
        message: 'Create group success',
        status: 'success',
        groupCode: saveGroupResponse.groupCode,
      });
    } else {
      return res.json({
        message: 'Save group failure',
        status: 'error',
        code: 30,
      });
    }
  }

  // Join group
  if (!leader) {
    // Cannot join own group
    if (ownSerial === groupCode) {
      return res.json({
        message: 'Cannot join own group',
        status: 'error',
        code: 33,
      });
    }

    // Check if code is valid
    let findSerialResponse;
    try {
      findSerialResponse = await db.user.findSerial({ serial: groupCode });
    } catch (error) {
      logger.error(`db.user.findSerial(): ${error}`);
      return res.json({
        message: 'Error finding serial',
        status: 'error',
        code: 31,
      });
    }

    // Code is valid
    if (!findSerialResponse) {
      return res.json({
        message: 'Invalid group code',
        status: 'error',
        code: 31,
      });
    }

    // Check if group leader has created a group
    let findGroupResponse;
    try {
      const leaderUsername = findSerialResponse.username;
      findGroupResponse = await db.user.findGroup(groupCode, leaderUsername);
    } catch (error) {
      logger.error(`db.user.findGroup(): ${error}`);
      return res.json({
        message: 'Error finding group',
        status: 'error',
        code: 32,
      });
    }

    // No existing group, cannot join
    if (!findGroupResponse) {
      return res.json({
        message: 'Group does not exist',
        status: 'error',
        code: 32,
      });
    }

    // Group exists, join
    let saveGroupResponse;
    try {
      saveGroupResponse = await db.user.saveGroupCode(groupCode, username);
    } catch (error) {
      logger.error(`db.user.saveGroup(): ${error}`);
      return res.json({
        message: 'Error saving group',
        status: 'error',
        code: 30,
      });
    }

    if (saveGroupResponse) {
      return res.json({
        message: 'Joined to group success',
        status: 'success',
        groupCode: saveGroupResponse.groupCode,
      });
    } else {
      logger.error('Failed to sign to group');
      return res.json({
        message: 'Failed to update group',
        status: 'error',
        code: 30,
      });
    }
  }
};

// Get group members
const getGroup = async (req: Request, res: Response): Promise<unknown> => {
  logger.info('API call: GET /api/group');

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.user
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const GetGroupQueryParameters = Record({
    groupCode: String,
  });

  let queryParameters;

  try {
    queryParameters = GetGroupQueryParameters.check(req.query);
  } catch (error) {
    return res.sendStatus(422);
  }

  const { groupCode } = queryParameters;

  let findGroupResults: User[];
  try {
    findGroupResults = await db.user.findGroupMembers(groupCode);

    const returnData: GetGroupReturValue[] = [];
    for (const findGroupResult of findGroupResults) {
      returnData.push({
        groupCode: findGroupResult.groupCode,
        signedGames: findGroupResult.signedGames,
        enteredGames: findGroupResult.enteredGames,
        serial: findGroupResult.serial,
        username: findGroupResult.username,
      });
    }

    return res.json({
      message: 'Getting group members success',
      status: 'success',
      results: returnData,
    });
  } catch (error) {
    logger.error(`Results: ${error}`);
    return res.json({
      message: 'Getting group members failed',
      status: 'error',
      error,
    });
  }
};

export { postGroup, getGroup };

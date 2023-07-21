import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetGroupRequest,
  GetGroupRequestSchema,
  PostCloseGroupRequest,
  PostCloseGroupRequestSchema,
  PostCreateGroupRequest,
  PostCreateGroupRequestSchema,
  PostJoinGroupRequest,
  PostJoinGroupRequestSchema,
} from "shared/typings/api/groups";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { UserGroup } from "shared/typings/models/user";
import {
  closeGroup,
  createGroup,
  fetchGroup,
  joinGroup,
  leaveGroup,
} from "server/features/user/group/groupService";

export const postCreateGroup = async (
  req: Request<{}, {}, PostCreateGroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.GROUP}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostCreateGroupRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(`Error validating postCreateGroup body: ${result.error}`)
    );
    return res.sendStatus(422);
  }

  const { groupCode } = result.data;
  const response = await createGroup(username, groupCode);
  return res.json(response);
};

export const postJoinGroup = async (
  req: Request<{}, {}, PostJoinGroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.JOIN_GROUP}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostJoinGroupRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(`Error validating postJoinGroup body: ${result.error}`)
    );
    return res.sendStatus(422);
  }

  const { groupCode, ownSerial } = result.data;
  const response = await joinGroup(username, groupCode, ownSerial);
  return res.json(response);
};

export const postLeaveGroup = async (
  req: Request<{}, {}, {}>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.LEAVE_GROUP}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const response = await leaveGroup(username);
  return res.json(response);
};

export const postCloseGroup = async (
  req: Request<{}, {}, PostCloseGroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.CLOSE_GROUP}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostCloseGroupRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(`Error validating postCloseGroup body: ${result.error}`)
    );
    return res.sendStatus(422);
  }

  const { groupCode } = result.data;
  const response = await closeGroup(groupCode, username);
  return res.json(response);
};

export const getGroup = async (
  req: Request<{}, {}, GetGroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.GROUP}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = GetGroupRequestSchema.safeParse(req.query);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(`Error validating getGroup params: ${result.error}`)
    );
    return res.sendStatus(422);
  }

  const { groupCode } = result.data;
  const response = await fetchGroup(groupCode);
  return res.json(response);
};

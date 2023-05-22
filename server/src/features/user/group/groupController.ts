import { Request, Response } from "express";
import { ZodError } from "zod";
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
import { isAuthorized } from "server/utils/authHeader";
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

  const username = isAuthorized(req.headers.authorization, UserGroup.USER);
  if (!username) {
    return res.sendStatus(401);
  }

  let groupRequest: PostCreateGroupRequest;
  try {
    groupRequest = PostCreateGroupRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating postCreateGroup parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const { groupCode } = groupRequest;

  const response = await createGroup(username, groupCode);
  return res.json(response);
};

export const postJoinGroup = async (
  req: Request<{}, {}, PostJoinGroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.JOIN_GROUP}`);

  const username = isAuthorized(req.headers.authorization, UserGroup.USER);
  if (!username) {
    return res.sendStatus(401);
  }

  let groupRequest: PostJoinGroupRequest;
  try {
    groupRequest = PostJoinGroupRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating postJoinGroup parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const { groupCode, ownSerial } = groupRequest;

  const response = await joinGroup(username, groupCode, ownSerial);
  return res.json(response);
};

export const postLeaveGroup = async (
  req: Request<{}, {}, {}>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.LEAVE_GROUP}`);

  const username = isAuthorized(req.headers.authorization, UserGroup.USER);
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

  const username = isAuthorized(req.headers.authorization, UserGroup.USER);
  if (!username) {
    return res.sendStatus(401);
  }

  let groupRequest: PostCloseGroupRequest;
  try {
    groupRequest = PostCloseGroupRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating postCloseGroup parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const { groupCode } = groupRequest;

  const response = await closeGroup(groupCode, username);
  return res.json(response);
};

export const getGroup = async (
  req: Request<{}, {}, GetGroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.GROUP}`);

  const username = isAuthorized(req.headers.authorization, UserGroup.USER);
  if (!username) {
    return res.sendStatus(401);
  }

  let parameters;
  try {
    parameters = GetGroupRequestSchema.parse(req.query);
  } catch (error) {
    return res.sendStatus(422);
  }

  const { groupCode } = parameters;

  const response = await fetchGroup(groupCode);
  return res.json(response);
};

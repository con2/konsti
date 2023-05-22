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
  PostLeaveGroupRequest,
  PostLeaveGroupRequestSchema,
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

  const { username, groupCode } = groupRequest;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  const response = await createGroup(username, groupCode);
  return res.json(response);
};

export const postJoinGroup = async (
  req: Request<{}, {}, PostJoinGroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.JOIN_GROUP}`);

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

  const { username, groupCode, ownSerial } = groupRequest;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  const response = await joinGroup(username, groupCode, ownSerial);
  return res.json(response);
};

export const postLeaveGroup = async (
  req: Request<{}, {}, PostLeaveGroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.LEAVE_GROUP}`);

  let groupRequest: PostLeaveGroupRequest;
  try {
    groupRequest = PostLeaveGroupRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating postLeaveGroup parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const { username } = groupRequest;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
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

  const { username, groupCode } = groupRequest;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  const response = await closeGroup(groupCode, username);
  return res.json(response);
};

export const getGroup = async (
  req: Request<{}, {}, GetGroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.GROUP}`);

  let parameters;
  try {
    parameters = GetGroupRequestSchema.parse(req.query);
  } catch (error) {
    return res.sendStatus(422);
  }

  const { groupCode, username } = parameters;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  const response = await fetchGroup(groupCode);
  return res.json(response);
};

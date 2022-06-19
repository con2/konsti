import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  CloseGroupRequest,
  CloseGroupRequestSchema,
  CreateGroupRequest,
  CreateGroupRequestSchema,
  JoinGroupRequest,
  JoinGroupRequestSchema,
  LeaveGroupRequest,
  LeaveGroupRequestSchema,
} from "shared/typings/api/groups";
import { isAuthorized } from "server/utils/authHeader";
import { UserGroup } from "shared/typings/models/user";
import {
  closeGroupFunction,
  createGroup,
  fetchGroup,
  joinGroup,
  leaveGroupFunction,
} from "server/features/user/group/groupService";

export const postGroup = async (
  req: Request<{}, {}, CreateGroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.GROUP}`);

  let groupRequest: CreateGroupRequest;
  try {
    groupRequest = CreateGroupRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating postGroup parameters: ${error.message}`);
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
  req: Request<{}, {}, JoinGroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.GROUP}`);

  let groupRequest: JoinGroupRequest;
  try {
    groupRequest = JoinGroupRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating postGroup parameters: ${error.message}`);
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
  req: Request<{}, {}, LeaveGroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.GROUP}`);

  let groupRequest: LeaveGroupRequest;
  try {
    groupRequest = LeaveGroupRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating postGroup parameters: ${error.message}`);
    }
    return res.sendStatus(422);
  }

  const { username } = groupRequest;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  const response = await leaveGroupFunction(username);
  return res.json(response);
};

export const postCloseGroup = async (
  req: Request<{}, {}, CloseGroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.GROUP}`);

  let groupRequest: CloseGroupRequest;
  try {
    groupRequest = CloseGroupRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating postGroup parameters: ${error.message}`);
    }
    return res.sendStatus(422);
  }

  const { username, groupCode } = groupRequest;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  const response = await closeGroupFunction(groupCode);
  return res.json(response);
};

export const getGroup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.GROUP}`);

  const GetGroupQueryParameters = z.object({
    groupCode: z.string(),
    username: z.string(),
  });

  let parameters;
  try {
    parameters = GetGroupQueryParameters.parse(req.query);
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

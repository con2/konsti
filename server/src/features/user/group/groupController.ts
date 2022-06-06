import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { GroupRequest, GroupRequestSchema } from "shared/typings/api/groups";
import { isAuthorized } from "server/utils/authHeader";
import { UserGroup } from "shared/typings/models/user";
import {
  fetchGroup,
  storeGroup,
} from "server/features/user/group/groupService";

export const postGroup = async (
  req: Request<{}, {}, GroupRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.GROUP}`);

  let groupRequest: GroupRequest;
  try {
    groupRequest = GroupRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Error validating postGroup parameters: ${error.message}`);
    }
    return res.sendStatus(422);
  }

  const {
    username,
    isGroupCreator,
    groupCode,
    ownSerial,
    leaveGroup,
    closeGroup,
  } = groupRequest;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  const response = await storeGroup(
    username,
    isGroupCreator,
    groupCode,
    ownSerial,
    leaveGroup,
    closeGroup
  );
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

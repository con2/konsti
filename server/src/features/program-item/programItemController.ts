import { Request, Response } from "express";
import {
  getAuthorizedUserGroup,
  getAuthorizedUsername,
} from "server/utils/authHeader";
import { UserGroup } from "shared/types/models/user";
import {
  fetchProgramItems,
  updateProgramItems,
} from "server/features/program-item/programItemService";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const postUpdateProgramItems = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.PROGRAM_ITEMS}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const response = await updateProgramItems();
  return res.json(response);
};

export const getProgramItems = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.PROGRAM_ITEMS}`);

  const userGroup = getAuthorizedUserGroup(req.headers.authorization);
  const response = await fetchProgramItems(userGroup);
  return res.json(response);
};

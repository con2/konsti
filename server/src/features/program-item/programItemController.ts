import { Request, Response } from "express";
import {
  authorizeUsingApiKey,
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
import { autoUpdateProgramItems } from "server/utils/cron";

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

export const postAutoUpdateProgramItems = (
  req: Request,
  res: Response,
): Response => {
  logger.info(`API call: POST ${ApiEndpoint.PROGRAM_UPDATE_CRON}`);

  const validAuthorization = authorizeUsingApiKey(req.headers.authorization);
  if (!validAuthorization) {
    return res.sendStatus(401);
  }

  autoUpdateProgramItems().catch((error: unknown) => {
    logger.error("autoUpdateProgramItems failed: %s", error);
  });

  return res.sendStatus(200);
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

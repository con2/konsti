import { Request, Response } from "express";
import { storeAssignment } from "server/features/player-assignment/assignmentController";
import { fetchResults } from "server/features/results/resultsService";
import { UserGroup } from "shared/typings/models/user";
import {
  authorizeUsingApiKey,
  getAuthorizedUsername,
} from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostPlayerAssignmentRequest,
  PostPlayerAssignmentRequestSchema,
} from "shared/typings/api/assignment";
import {
  GetResultsRequest,
  GetResultsRequestSchema,
} from "shared/typings/api/results";
import { autoAssignPlayers } from "server/utils/cron";

export const getResults = async (
  req: Request<{}, {}, GetResultsRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.RESULTS}`);

  const result = GetResultsRequestSchema.safeParse(req.query);
  if (!result.success) {
    logger.error("Error validating getResults body: %s", result.error);
    return res.sendStatus(422);
  }

  const { startTime } = result.data;

  if (!startTime) {
    return res.sendStatus(422);
  }

  const response = await fetchResults(startTime);
  return res.json(response);
};

export const postAssignment = async (
  req: Request<{}, {}, PostPlayerAssignmentRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.ASSIGNMENT}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostPlayerAssignmentRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "Parsing postAssignment() request body failed: %s",
      result.error
    );
    return res.sendStatus(422);
  }

  const response = await storeAssignment(result.data.startingTime);
  return res.json(response);
};

export const postAutoAssignment = (
  req: Request<{}, {}, PostPlayerAssignmentRequest>,
  res: Response
): Response => {
  logger.info(`API call: POST ${ApiEndpoint.ASSIGNMENT_CRON}`);

  const validAuthorization = authorizeUsingApiKey(req.headers.authorization);
  if (!validAuthorization) {
    return res.sendStatus(401);
  }

  autoAssignPlayers().catch((error) => {
    logger.error("autoUpdateGames failed: %s", error);
  });

  return res.sendStatus(200);
};

import { Request, Response } from "express";
import { storeAssignment } from "server/features/player-assignment/assignmentController";
import { fetchResults } from "server/features/results/resultsService";
import { UserGroup } from "shared/typings/models/user";
import { isAuthorized } from "server/utils/authHeader";
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

export const getResults = async (
  req: Request<{}, {}, GetResultsRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.RESULTS}`);

  let parameters;
  try {
    parameters = GetResultsRequestSchema.parse(req.query);
  } catch (error) {
    return res.sendStatus(422);
  }

  const { startTime } = parameters;

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

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, "admin")) {
    return res.sendStatus(401);
  }

  let body;
  try {
    body = PostPlayerAssignmentRequestSchema.parse(req.body);
  } catch (error) {
    logger.error(`Parsing postAssignment() request body failed: ${error}`);
    return res.sendStatus(422);
  }

  const startingTime = body.startingTime;
  const response = await storeAssignment(startingTime);
  return res.json(response);
};

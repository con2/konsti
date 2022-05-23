import { Request, Response } from "express";
import { z } from "zod";
import { storeAssignment } from "server/features/player-assignment/assignmentController";
import { fetchResults } from "server/features/results/resultsService";
import { UserGroup } from "shared/typings/models/user";
import { isAuthorized } from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const getResults = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.RESULTS}`);

  const GetResultsQueryParameters = z.object({
    startTime: z.string(),
  });

  let parameters;
  try {
    parameters = GetResultsQueryParameters.parse(req.query);
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
  req: Request<{}, {}, { startingTime: string }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.ASSIGNMENT}`);

  if (!isAuthorized(req.headers.authorization, UserGroup.ADMIN, "admin")) {
    return res.sendStatus(401);
  }

  const PostAssignmentBody = z.object({
    startingTime: z.string().min(1),
  });

  let body;
  try {
    body = PostAssignmentBody.parse(req.body);
  } catch (error) {
    logger.error(`Parsing postAssignment() request body failed: ${error}`);
    return res.sendStatus(422);
  }

  const startingTime = body.startingTime;
  const response = await storeAssignment(startingTime);
  return res.json(response);
};

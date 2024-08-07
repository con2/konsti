import { Request, Response } from "express";
import { storeAssignment } from "server/features/assignment/assignmentController";
import { fetchResults } from "server/features/results/resultsService";
import { UserGroup } from "shared/types/models/user";
import {
  authorizeUsingApiKey,
  getAuthorizedUsername,
} from "server/utils/authHeader";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostAssignmentRequestSchema } from "shared/types/api/assignment";
import { GetResultsRequestSchema } from "shared/types/api/results";
import { autoAssignAttendees } from "server/utils/cron";

export const getResults = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.RESULTS}`);

  const result = GetResultsRequestSchema.safeParse(req.query);
  if (!result.success) {
    logger.error(
      "%s",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      new Error(`Error validating getResults body: ${result.error}`),
    );
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
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.ASSIGNMENT}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostAssignmentRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "Parsing postAssignment() request body failed: %s",
      result.error,
    );
    return res.sendStatus(422);
  }

  const response = await storeAssignment(result.data.startTime);
  return res.json(response);
};

export const postAutoAssignment = (req: Request, res: Response): Response => {
  logger.info(`API call: POST ${ApiEndpoint.ASSIGNMENT_CRON}`);

  const validAuthorization = authorizeUsingApiKey(req.headers.authorization);
  if (!validAuthorization) {
    return res.sendStatus(401);
  }

  autoAssignAttendees().catch((error: unknown) => {
    logger.error("runAutoAssignment failed: %s", error);
  });

  return res.sendStatus(200);
};

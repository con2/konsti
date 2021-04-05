import { Request, Response } from 'express';
import { Record, String } from 'runtypes';
import { storeAssignment } from 'server/features/player-assignment/assignmentController';
import { fetchResults } from 'server/features/results/resultsService';
import { UserGroup } from 'server/typings/user.typings';
import { validateAuthHeader } from 'server/utils/authHeader';
import { logger } from 'server/utils/logger';
import { RESULTS_ENDPOINT } from 'shared/constants/apiEndpoints';

export const getResults = async (
  req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${RESULTS_ENDPOINT}`);

  const GetResultsQueryParameters = Record({
    startTime: String,
  });

  let queryParameters;
  try {
    queryParameters = GetResultsQueryParameters.check(req.query);
  } catch (error) {
    return res.sendStatus(422);
  }

  const { startTime } = queryParameters;

  if (!startTime) {
    return res.sendStatus(422);
  }

  const response = await fetchResults(startTime);
  return res.send(response);
};

export const postAssignment = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const startingTime = req.body.startingTime;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  const response = await storeAssignment(startingTime);
  return res.send(response);
};

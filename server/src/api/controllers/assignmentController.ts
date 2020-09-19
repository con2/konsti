import { logger } from 'utils/logger';
import { removeOverlapSignups } from 'player-assignment/utils/removeOverlapSignups';
import { saveResults } from 'player-assignment/utils/saveResults';
import { runAssignment } from 'player-assignment/runAssignment';
import { validateAuthHeader } from 'utils/authHeader';
import { config } from 'config';
import { Request, Response } from 'express';
import { UserGroup } from 'typings/user.typings';

// Assign players to games
const postAssignment = async (
  req: Request,
  res: Response
): Promise<unknown> => {
  logger.info('API call: POST /api/assignment');
  const startingTime = req.body.startingTime;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  if (!startingTime) {
    return res.json({
      message: 'Invalid starting time',
      status: 'error',
    });
  }

  let assignResults;
  try {
    assignResults = await runAssignment(startingTime);
  } catch (error) {
    logger.error(`Player assign error: ${error}`);
    return res.json({
      message: 'Players assign failure',
      status: 'error',
    });
  }

  if (!assignResults || !assignResults.results) {
    return res.json({
      message: 'Players assign failure',
      status: 'error',
    });
  }

  try {
    await saveResults(
      assignResults.results,
      startingTime,
      assignResults.algorithm,
      assignResults.message
    );
  } catch (error) {
    logger.error(`saveResult error: ${error}`);
    return res.json({
      message: 'Players assign failure',
      status: 'error',
      error,
    });
  }

  // Remove overlapping signups
  if (config.enableRemoveOverlapSignups) {
    try {
      logger.info('Remove overlapping signups');
      await removeOverlapSignups(assignResults.results);
    } catch (error) {
      logger.error(`removeOverlapSignups error: ${error}`);
      return res.json({
        message: 'Players assign failure',
        status: 'error',
        error,
      });
    }
  }

  return res.json({
    message: 'Players assign success',
    status: 'success',
    results: assignResults.results,
    resultMessage: assignResults.message,
    startTime: startingTime,
  });
};

export { postAssignment };

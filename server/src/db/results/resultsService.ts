import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { ResultsModel } from 'db/results/resultsSchema';
import { Result, ResultsCollectionEntry } from 'typings/result.typings';
import { GameDoc } from 'typings/game.typings';

const removeResults = async (): Promise<void> => {
  logger.info('MongoDB: remove ALL results from db');
  await ResultsModel.deleteMany({});
};

const findResult = async (
  startTime: string
): Promise<ResultsCollectionEntry | null> => {
  let response;
  try {
    response = await ResultsModel.findOne(
      { startTime },
      '-_id -__v -createdAt -updatedAt -result._id'
    )
      .lean<ResultsCollectionEntry>()
      .sort({ createdAt: -1 })
      .populate('results.enteredGame.gameDetails');
    logger.debug(`MongoDB: Results data found for time ${startTime}`);
  } catch (error) {
    throw new Error(
      `MongoDB: Error finding results data for time ${startTime} - ${error}`
    );
  }
  return response;
};

const findResults = async (): Promise<ResultsCollectionEntry[]> => {
  let response;
  try {
    response = await ResultsModel.find(
      {},
      '-_id -__v -createdAt -updatedAt -result._id'
    )
      .lean<ResultsCollectionEntry>()
      .sort({ createdAt: -1 })
      .populate('results.enteredGame.gameDetails');
  } catch (error) {
    throw new Error(`MongoDB: Error loading all results  - ${error}`);
  }

  logger.debug(`MongoDB: Succesfully loaded all results`);
  return response;
};

const saveResult = async (
  signupResultData: readonly Result[],
  startTime: string,
  algorithm: string,
  message: string
): Promise<ResultsCollectionEntry> => {
  let games: GameDoc[] = [];
  try {
    games = await db.game.findGames();
  } catch (error) {
    logger.error(`MongoDB: Error loading games - ${error}`);
    return error;
  }

  const results = signupResultData.reduce<Result[]>((acc, result) => {
    const gameDocInDb = games.find(
      (game) => game.gameId === result.enteredGame.gameDetails.gameId
    );

    if (gameDocInDb) {
      acc.push({
        username: result.username,
        enteredGame: {
          gameDetails: gameDocInDb._id,
          priority: result.enteredGame.priority,
          time: result.enteredGame.time,
        },
      });
    }
    return acc;
  }, []);

  let response;
  try {
    response = await ResultsModel.replaceOne(
      { startTime },
      { startTime, results, algorithm, message },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      { upsert: true }
    );
    logger.debug(
      `MongoDB: Signup results for starting time ${startTime} stored to separate collection`
    );
  } catch (error) {
    logger.error(
      `MongoDB: Error storing signup results for starting time ${startTime} to separate collection - ${error}`
    );
    return error;
  }

  return response;
};

export const results = { removeResults, saveResult, findResult, findResults };

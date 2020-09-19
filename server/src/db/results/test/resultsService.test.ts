import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { db } from 'db/mongodb';
import { ResultsModel } from 'db/results/resultsSchema';
import { Result } from 'typings/result.typings';

let mongoServer: MongoMemoryServer;

const options = {
  promiseLibrary: global.Promise,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getConnectionString();
  await mongoose.connect(mongoUri, options);
});

afterEach(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Results service', () => {
  it('should insert new result into collection', async () => {
    const signupResultData: Result[] = [];
    const startTime = '2019-07-26T14:00:00.000Z';
    const algorithm = 'group';
    const message = 'Test assign result message';

    await db.results.saveResult(
      signupResultData,
      startTime,
      algorithm,
      message
    );

    const insertedResults = await ResultsModel.findOne({ message });
    expect(insertedResults?.message).toEqual(message);
  });
});

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ResultsModel } from 'server/features/results/resultsSchema';
import { Result } from 'shared/typings/models/result';
import { saveResult } from 'server/features/results/resultsRepository';

let mongoServer: MongoMemoryServer;

const options = {
  promiseLibrary: global.Promise,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getUri();
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

    await saveResult(signupResultData, startTime, algorithm, message);

    const insertedResults = await ResultsModel.findOne({ message });
    expect(insertedResults?.message).toEqual(message);
  });
});

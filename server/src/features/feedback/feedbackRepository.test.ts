import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { FeedbackModel } from 'server/features/feedback/feedbackSchema';
import { saveFeedback } from 'server/features/feedback/feedbackRepository';

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

test('should insert new feedback into collection', async () => {
  const mockFeedback = { gameId: '1234A', feedback: 'Test feedback' };
  await saveFeedback(mockFeedback);

  const insertedFeedback = await FeedbackModel.findOne(mockFeedback);
  expect(insertedFeedback?.gameId).toEqual(mockFeedback.gameId);
  expect(insertedFeedback?.feedback).toEqual(mockFeedback.feedback);
});

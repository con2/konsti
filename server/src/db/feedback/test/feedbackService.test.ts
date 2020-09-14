import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { db } from 'db/mongodb';
import { FeedbackModel } from 'db/feedback/feedbackSchema';

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

describe('Feedback service', () => {
  it('should insert new feedback into collection', async () => {
    const mockFeedback = { gameId: '1234A', feedback: 'Test feedback' };
    await db.feedback.saveFeedback(mockFeedback);

    const insertedFeedback = await FeedbackModel.findOne(mockFeedback);
    expect(insertedFeedback?.gameId).toEqual(mockFeedback.gameId);
    expect(insertedFeedback?.feedback).toEqual(mockFeedback.feedback);
  });
});

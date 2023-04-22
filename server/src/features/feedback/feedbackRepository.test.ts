import {
  expect,
  test,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
} from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { FeedbackModel } from "server/features/feedback/feedbackSchema";
import { saveFeedback } from "server/features/feedback/feedbackRepository";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  await mongoose.connect(mongoServer.getUri(), {
    dbName: faker.random.alphaNumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

afterAll(async () => {
  await mongoServer.stop();
});

test("should insert new feedback into collection", async () => {
  const mockFeedback = {
    gameId: "1234A",
    feedback: "Test feedback",
    username: "Test user",
  };
  await saveFeedback(mockFeedback);

  const insertedFeedback = await FeedbackModel.findOne(mockFeedback);
  expect(insertedFeedback?.gameId).toEqual(mockFeedback.gameId);
  expect(insertedFeedback?.feedback).toEqual(mockFeedback.feedback);
});

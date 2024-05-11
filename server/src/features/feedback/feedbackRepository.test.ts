import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { FeedbackModel } from "server/features/feedback/feedbackSchema";
import { saveFeedback } from "server/features/feedback/feedbackRepository";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should insert new feedback into collection", async () => {
  const mockFeedback = {
    programItemId: "1234A",
    feedback: "Test feedback",
    username: "Test user",
  };
  await saveFeedback(mockFeedback);

  const insertedFeedback = await FeedbackModel.findOne(mockFeedback);
  expect(insertedFeedback?.programItemId).toEqual(mockFeedback.programItemId);
  expect(insertedFeedback?.feedback).toEqual(mockFeedback.feedback);
});

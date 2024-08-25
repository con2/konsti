import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { ResultsModel } from "server/features/results/resultsSchema";
import { UserAssignmentResult } from "shared/types/models/result";
import { saveResult } from "server/features/results/resultsRepository";
import { AssignmentStrategy } from "shared/config/eventConfigTypes";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should insert new result into collection", async () => {
  const signupResultData: UserAssignmentResult[] = [];
  const startTime = "2019-07-26T14:00:00.000Z";
  const algorithm = AssignmentStrategy.PADG;
  const message = "Test assign result message";

  await saveResult(signupResultData, startTime, algorithm, message);

  const insertedResults = await ResultsModel.findOne({ message });
  expect(insertedResults?.message).toEqual(message);
});

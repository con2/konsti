import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { ResultsModel } from "server/features/results/resultsSchema";
import { AssignmentResult } from "shared/typings/models/result";
import { saveResult } from "server/features/results/resultsRepository";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should insert new result into collection", async () => {
  const signupResultData: AssignmentResult[] = [];
  const startTime = "2019-07-26T14:00:00.000Z";
  const algorithm = "group";
  const message = "Test assign result message";

  await saveResult(signupResultData, startTime, algorithm, message);

  const insertedResults = await ResultsModel.findOne({ message });
  expect(insertedResults?.message).toEqual(message);
});

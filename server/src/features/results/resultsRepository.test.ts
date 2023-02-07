import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { ResultsModel } from "server/features/results/resultsSchema";
import { Result } from "shared/typings/models/result";
import { saveResult } from "server/features/results/resultsRepository";

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

test("should insert new result into collection", async () => {
  const signupResultData: Result[] = [];
  const startTime = "2019-07-26T14:00:00.000Z";
  const algorithm = "group";
  const message = "Test assign result message";

  await saveResult(signupResultData, startTime, algorithm, message);

  const insertedResults = await ResultsModel.findOne({ message });
  expect(insertedResults?.message).toEqual(message);
});

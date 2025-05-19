import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { ResultsModel } from "server/features/results/resultsSchema";
import { UserAssignmentResult } from "shared/types/models/result";
import { saveResult } from "server/features/results/resultsRepository";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { mockUser, mockUser2 } from "server/test/mock-data/mockUser";
import { testProgramItem } from "shared/tests/testProgramItem";
import { AssignmentResult } from "server/types/resultTypes";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should insert new result into collection", async () => {
  const signupResults: UserAssignmentResult[] = [
    {
      username: mockUser.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
    {
      username: mockUser2.username,
      assignmentSignup: {
        programItemId: testProgramItem.programItemId,
        priority: 1,
        signedToStartTime: testProgramItem.startTime,
      },
    },
  ];
  const assignmentTime = testProgramItem.startTime;
  const algorithm = AssignmentAlgorithm.PADG;
  const message = "Test assign result message";

  await saveResult(signupResults, assignmentTime, algorithm, message);

  const insertedResults = await ResultsModel.find().lean<AssignmentResult[]>();
  expect(insertedResults).toHaveLength(1);

  expect(insertedResults[0]).toMatchObject({
    results: [
      {
        assignmentSignup: {
          programItemId: testProgramItem.programItemId,
          priority: 1,
          signedToStartTime: new Date(testProgramItem.startTime),
        },
        username: mockUser.username,
      },
      {
        assignmentSignup: {
          programItemId: testProgramItem.programItemId,
          priority: 1,
          signedToStartTime: new Date(testProgramItem.startTime),
        },
        username: mockUser2.username,
      },
    ],
    message,
    assignmentTime: new Date(assignmentTime),
    algorithm,
  });
});

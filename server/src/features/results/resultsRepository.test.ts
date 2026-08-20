import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test } from "vitest";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  AssignmentResultGroup,
  UserAssignmentResult,
} from "shared/types/models/result";
import { db } from "server/db/mongodb";
import {
  findResults,
  saveResult,
} from "server/features/results/resultsRepository";
import { mockUser, mockUser2 } from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
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
  const groups: AssignmentResultGroup[] = [
    {
      groupCode: "123-234-345",
      groupCreator: mockUser.username,
      groupMembers: [mockUser.username, mockUser2.username],
    },
  ];
  const assignmentTime = testProgramItem.startTime;
  const algorithm = AssignmentAlgorithm.PADG;
  const message = "Test assign result message";

  await saveResult(signupResults, groups, assignmentTime, algorithm, message);

  const insertedResults = unsafelyUnwrap(await findResults());
  expect(insertedResults).toHaveLength(1);

  expect(insertedResults[0]).toMatchObject({
    results: [
      {
        assignmentSignup: {
          programItemId: testProgramItem.programItemId,
          priority: 1,
          signedToStartTime: testProgramItem.startTime,
        },
        username: mockUser.username,
      },
      {
        assignmentSignup: {
          programItemId: testProgramItem.programItemId,
          priority: 1,
          signedToStartTime: testProgramItem.startTime,
        },
        username: mockUser2.username,
      },
    ],
    groups,
    message,
    assignmentTime,
    algorithm,
  });
});

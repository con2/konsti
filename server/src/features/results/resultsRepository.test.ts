import { randomUUID } from "node:crypto";
import { setSeconds } from "date-fns";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
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
  vi.restoreAllMocks();
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

const makeResult = (
  username: string,
  programItemId: string,
): UserAssignmentResult => ({
  username,
  assignmentSignup: {
    programItemId,
    priority: 1,
    signedToStartTime: testProgramItem.startTime,
  },
});

test("should record a group that took part but was placed nowhere", async () => {
  // The snapshot is an account of who competed for this start time, so a group that came
  // away with nothing belongs in it as much as one that won
  const assignmentTime = testProgramItem.startTime;

  await saveResult(
    [makeResult(mockUser.username, testProgramItem.programItemId)],
    [
      {
        groupCode: "placed-group",
        groupCreator: mockUser.username,
        groupMembers: [mockUser.username],
      },
      {
        groupCode: "unplaced-group",
        groupCreator: mockUser2.username,
        groupMembers: [mockUser2.username],
      },
    ],
    assignmentTime,
    AssignmentAlgorithm.PADG,
    "One group placed, one not",
  );

  const results = unsafelyUnwrap(await findResults());
  expect(
    results[0].groups
      .map((group) => group.groupCode)
      .toSorted((a, b) => a.localeCompare(b)),
  ).toEqual(["placed-group", "unplaced-group"]);
});

test("should keep one document per start time when the times differ only in seconds", async () => {
  // A manual run takes the time from the request, so it can carry seconds the cron's own
  // start-of-minute time doesn't. Every other start time comparison matches to the minute,
  // so these two address one lottery and must not split into two documents.
  const firstTime = testProgramItem.startTime;
  const secondTime = setSeconds(new Date(firstTime), 30).toISOString();

  await saveResult(
    [makeResult(mockUser.username, testProgramItem.programItemId)],
    [],
    firstTime,
    AssignmentAlgorithm.PADG,
    "First write",
  );

  await saveResult(
    [makeResult(mockUser2.username, testProgramItem2.programItemId)],
    [],
    secondTime,
    AssignmentAlgorithm.PADG,
    "Second write",
  );

  const results = unsafelyUnwrap(await findResults());
  expect(results).toHaveLength(1);
  expect(results[0].results).toHaveLength(2);
  expect(results[0].results.map((result) => result.username)).toEqual(
    expect.arrayContaining([mockUser.username, mockUser2.username]),
  );
});

test("should store a document for a run that placed nobody", async () => {
  // A run that lotteried something is recorded whatever it managed to place - the dashboard
  // decides what is worth showing, rather than the record deciding what is worth keeping
  await saveResult(
    [],
    [],
    testProgramItem.startTime,
    AssignmentAlgorithm.PADG,
    "Empty run",
  );

  const savedResults = unsafelyUnwrap(await findResults());
  expect(savedResults).toHaveLength(1);
  expect(savedResults[0].results).toHaveLength(0);
  expect(savedResults[0].message).toEqual("Empty run");
});

test("should keep an earlier attempt's placements when a start time is run again", async () => {
  // A run that saved its spots and failed before marking them can be run again, and the second
  // attempt skips the program items the first one filled - so it carries fewer placements
  const assignmentTime = testProgramItem.startTime;
  unsafelyUnwrap(
    await saveResult(
      [makeResult(mockUser.username, testProgramItem.programItemId)],
      [],
      assignmentTime,
      AssignmentAlgorithm.PADG,
      "First attempt",
    ),
  );
  unsafelyUnwrap(
    await saveResult(
      [makeResult(mockUser2.username, testProgramItem.programItemId)],
      [],
      assignmentTime,
      AssignmentAlgorithm.PADG,
      "Second attempt",
    ),
  );

  const results = unsafelyUnwrap(await findResults());

  expect(results).toHaveLength(1);
  expect(results[0].results).toHaveLength(2);
  expect(results[0].results.map((result) => result.username)).toEqual(
    expect.arrayContaining([mockUser.username, mockUser2.username]),
  );
});

test("should record a placement once when the same attendee is written again", async () => {
  const assignmentTime = testProgramItem.startTime;
  const result = makeResult(mockUser.username, testProgramItem.programItemId);

  unsafelyUnwrap(
    await saveResult(
      [result],
      [],
      assignmentTime,
      AssignmentAlgorithm.PADG,
      "",
    ),
  );
  unsafelyUnwrap(
    await saveResult(
      [result],
      [],
      assignmentTime,
      AssignmentAlgorithm.PADG,
      "",
    ),
  );

  const results = unsafelyUnwrap(await findResults());

  // An attendee holds one spot per start time, so writing it again replaces the earlier record
  expect(results[0].results).toHaveLength(1);
});

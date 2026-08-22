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
  toAttendeeSpotKey,
} from "server/features/results/resultsRepository";
import { ResultsSchemaDb } from "server/features/results/resultsSchema";
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

  await saveResult(
    signupResults,
    groups,
    assignmentTime,
    algorithm,
    message,
    new Set(),
  );

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

test("should merge a later run's results into the ones already stored", async () => {
  const assignmentTime = testProgramItem.startTime;

  await saveResult(
    [makeResult(mockUser.username, testProgramItem.programItemId)],
    [],
    assignmentTime,
    AssignmentAlgorithm.PADG,
    "First run",
    new Set(),
  );

  // mockUser still holds the spot the first run gave them, so they stay in the snapshot
  await saveResult(
    [makeResult(mockUser2.username, testProgramItem2.programItemId)],
    [],
    assignmentTime,
    AssignmentAlgorithm.RANDOM,
    "Second run",
    new Set([
      toAttendeeSpotKey(mockUser.username, testProgramItem.programItemId),
    ]),
  );

  const results = unsafelyUnwrap(await findResults());
  expect(results).toHaveLength(1);
  expect(
    results[0].results
      .map((result) => result.username)
      .toSorted((a, b) => a.localeCompare(b)),
  ).toEqual(
    [mockUser.username, mockUser2.username].toSorted((a, b) =>
      a.localeCompare(b),
    ),
  );
  // The stored summary says it spans runs rather than describing only the latest one
  expect(results[0].message).toContain("more than one run");
});

test("should drop stored results for attendees who no longer hold a spot", async () => {
  const assignmentTime = testProgramItem.startTime;

  await saveResult(
    [makeResult(mockUser.username, testProgramItem.programItemId)],
    [],
    assignmentTime,
    AssignmentAlgorithm.PADG,
    "First run",
    new Set(),
  );

  // mockUser gave their spot up before this run, so their stale entry is pruned
  await saveResult(
    [makeResult(mockUser2.username, testProgramItem2.programItemId)],
    [],
    assignmentTime,
    AssignmentAlgorithm.PADG,
    "Second run",
    new Set(),
  );

  const results = unsafelyUnwrap(await findResults());
  expect(results[0].results.map((result) => result.username)).toEqual([
    mockUser2.username,
  ]);
});

test("should replace only the taking-part group's stored snapshot", async () => {
  const assignmentTime = testProgramItem.startTime;
  const untouchedGroup: AssignmentResultGroup = {
    groupCode: "group-1",
    groupCreator: mockUser.username,
    groupMembers: [mockUser.username],
  };

  await saveResult(
    [makeResult(mockUser.username, testProgramItem.programItemId)],
    [untouchedGroup],
    assignmentTime,
    AssignmentAlgorithm.PADG,
    "First run",
    new Set(),
  );

  await saveResult(
    [makeResult(mockUser2.username, testProgramItem2.programItemId)],
    [
      {
        groupCode: "group-2",
        groupCreator: mockUser2.username,
        groupMembers: [mockUser2.username],
      },
    ],
    assignmentTime,
    AssignmentAlgorithm.PADG,
    "Second run",
    new Set([
      toAttendeeSpotKey(mockUser.username, testProgramItem.programItemId),
    ]),
  );

  const results = unsafelyUnwrap(await findResults());
  expect(
    results[0].groups
      .map((group) => group.groupCode)
      .toSorted((a, b) => a.localeCompare(b)),
  ).toEqual(["group-1", "group-2"]);
});

test("should not overwrite stored results that fail validation", async () => {
  const assignmentTime = testProgramItem.startTime;

  await saveResult(
    [makeResult(mockUser.username, testProgramItem.programItemId)],
    [],
    assignmentTime,
    AssignmentAlgorithm.PADG,
    "First run",
    new Set(),
  );

  // A stored document that no longer parses must not be silently replaced, since the
  // merge would drop every result already recorded for this start time
  const failedParse = ResultsSchemaDb.safeParse(null);
  vi.spyOn(ResultsSchemaDb, "safeParse").mockReturnValueOnce(failedParse);

  const secondRunResult = await saveResult(
    [makeResult(mockUser2.username, testProgramItem2.programItemId)],
    [],
    assignmentTime,
    AssignmentAlgorithm.PADG,
    "Second run",
    new Set([
      toAttendeeSpotKey(mockUser.username, testProgramItem.programItemId),
    ]),
  );

  expect(secondRunResult.ok).toBe(false);

  const storedResults = unsafelyUnwrap(await findResults());
  expect(storedResults[0].results.map((result) => result.username)).toEqual([
    mockUser.username,
  ]);
});

test("should merge runs whose assignment times differ only in seconds", async () => {
  // A manual re-run takes the time from the request, so it can carry seconds the cron's
  // own start-of-minute time doesn't. Every other start time comparison matches to the
  // minute, so these two are one lottery and belong in one document
  const firstRunTime = testProgramItem.startTime;
  const secondRunTime = setSeconds(new Date(firstRunTime), 30).toISOString();

  await saveResult(
    [makeResult(mockUser.username, testProgramItem.programItemId)],
    [],
    firstRunTime,
    AssignmentAlgorithm.PADG,
    "First run",
    new Set(),
  );

  await saveResult(
    [makeResult(mockUser2.username, testProgramItem2.programItemId)],
    [],
    secondRunTime,
    AssignmentAlgorithm.PADG,
    "Second run",
    new Set([
      toAttendeeSpotKey(mockUser.username, testProgramItem.programItemId),
    ]),
  );

  const results = unsafelyUnwrap(await findResults());
  expect(results).toHaveLength(1);
  expect(
    results[0].results
      .map((result) => result.username)
      .toSorted((a, b) => a.localeCompare(b)),
  ).toEqual(
    [mockUser.username, mockUser2.username].toSorted((a, b) =>
      a.localeCompare(b),
    ),
  );
});

test("should not store a document for a run that placed nobody", async () => {
  // An additive re-run that finds nothing left to fill has no snapshot to write, and
  // must not leave an empty one behind
  await saveResult(
    [],
    [],
    testProgramItem.startTime,
    AssignmentAlgorithm.PADG,
    "Empty run",
    new Set(),
  );

  expect(unsafelyUnwrap(await findResults())).toHaveLength(0);
});

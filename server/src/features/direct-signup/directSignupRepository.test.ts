import { randomUUID } from "node:crypto";
import { addMinutes } from "date-fns";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { testProgramItem } from "shared/tests/testProgramItem";
import { db } from "server/db/mongodb";
import {
  createEmptyDirectSignupDocumentForProgramItems,
  delDirectSignup,
  delDirectSignups,
  findDirectSignups,
  findDirectSignupsByProgramItemIds,
  findDirectSignupsByStartTimes,
  removeDirectSignups,
  saveDirectSignup,
  saveDirectSignups,
} from "server/features/direct-signup/directSignupRepository";
import { SignupModel } from "server/features/direct-signup/directSignupSchema";
import { SignupRepositoryAddSignup } from "server/features/direct-signup/directSignupTypes";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { saveUser } from "server/features/user/userRepository";
import {
  mockPostDirectSignupRequest,
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
} from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
});

afterEach(async () => {
  vi.restoreAllMocks();
  await mongoose.disconnect();
});

test("should add new direct sign-up for user", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);

  const response = unsafelyUnwrap(
    await saveDirectSignup(mockPostDirectSignupRequest),
  );

  expect(response.programItemId).toEqual(testProgramItem.programItemId);
  expect(response.userSignups[0].username).toEqual(mockUser.username);
});

test("should delete direct sign-up from user", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);
  await saveDirectSignup(mockPostDirectSignupRequest);

  const response = unsafelyUnwrap(
    await delDirectSignup(mockPostDirectSignupRequest),
  );

  expect(response.userSignups.length).toEqual(0);
});

test("should fetch program item direct sign-ups", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);
  await saveDirectSignup(mockPostDirectSignupRequest);

  const response = unsafelyUnwrap(
    await findDirectSignupsByProgramItemIds([testProgramItem.programItemId]),
  );

  expect(response[0].programItemId).toEqual(testProgramItem.programItemId);
  expect(response[0].userSignups[0].username).toEqual(mockUser.username);
});

test("should limit max attendees if too many passed to saveDirectSignups", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveUser(mockUser3);
  await saveUser(mockUser4);
  await saveProgramItems([{ ...testProgramItem, maxAttendance: 2 }]);

  const signups: SignupRepositoryAddSignup[] = [
    mockPostDirectSignupRequest,
    { ...mockPostDirectSignupRequest, username: mockUser2.username },
    { ...mockPostDirectSignupRequest, username: mockUser3.username },
    { ...mockPostDirectSignupRequest, username: mockUser4.username },
  ];

  const programItems = unsafelyUnwrap(await findProgramItems());
  const response = unsafelyUnwrap(
    await saveDirectSignups(signups, programItems),
  );
  expect(response.modifiedCount).toEqual(1);
  expect(response.droppedSignups).toHaveLength(2);

  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].count).toEqual(2);
  expect(signupsAfterSave[0].userSignups).toHaveLength(2);
});

test("should set count to total userSignups when appending to a program item that already has direct sign-ups", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveProgramItems([{ ...testProgramItem, maxAttendance: 5 }]);

  // Pre-existing sign-up, e.g. a non-lottery sign-up or one left over from a moved program item
  await saveDirectSignup(mockPostDirectSignupRequest);

  const programItems = unsafelyUnwrap(await findProgramItems());

  // Assignment appends a new sign-up to the same program item document
  const signups: SignupRepositoryAddSignup[] = [
    { ...mockPostDirectSignupRequest, username: mockUser2.username },
  ];
  unsafelyUnwrap(await saveDirectSignups(signups, programItems));

  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].userSignups).toHaveLength(2);
  // count must reflect the total userSignups, not just the appended batch
  expect(signupsAfterSave[0].count).toEqual(2);
});

test("should not add multiple duplicate direct sign-ups for same user", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);

  await Promise.all([
    saveDirectSignup(mockPostDirectSignupRequest),
    saveDirectSignup(mockPostDirectSignupRequest),
    saveDirectSignup(mockPostDirectSignupRequest),
    saveDirectSignup(mockPostDirectSignupRequest),
  ]);

  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].count).toEqual(1);
  expect(signupsAfterSave[0].userSignups).toHaveLength(1);
});

test("should remove several users' direct sign-ups in one delDirectSignups call", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveProgramItems([{ ...testProgramItem, maxAttendance: 5 }]);

  await saveDirectSignup(mockPostDirectSignupRequest);
  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    username: mockUser2.username,
  });

  unsafelyUnwrap(
    await delDirectSignups([
      {
        username: mockUser.username,
        directSignupProgramItemId: testProgramItem.programItemId,
      },
      {
        username: mockUser2.username,
        directSignupProgramItemId: testProgramItem.programItemId,
      },
    ]),
  );

  const signupsAfterDelete = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterDelete).toHaveLength(1);
  expect(signupsAfterDelete[0].userSignups).toHaveLength(0);
  expect(signupsAfterDelete[0].count).toEqual(0);
});

test("should not delete multiple times if delete called multiple times", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);
  await saveDirectSignup(mockPostDirectSignupRequest);

  await Promise.all([
    delDirectSignup(mockPostDirectSignupRequest),
    delDirectSignup(mockPostDirectSignupRequest),
    delDirectSignup(mockPostDirectSignupRequest),
    delDirectSignup(mockPostDirectSignupRequest),
  ]);

  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterSave).toHaveLength(1);
  expect(signupsAfterSave[0].count).toEqual(0);
  expect(signupsAfterSave[0].userSignups).toHaveLength(0);
});

test("should find a parent-batched item's direct sign-ups by its own start time", async () => {
  // The item is batched under a parent whose start time drives the lottery, so its own
  // The parent batches the lottery, but a spot is held for the hour its program item runs at
  const parentStartTime = addMinutes(
    new Date(testProgramItem.startTime),
    30,
  ).toISOString();

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);
  await saveDirectSignup(mockPostDirectSignupRequest);

  const programItems = unsafelyUnwrap(await findProgramItems());

  // Looked up by the batch's lottery time, the spot is not there
  expect(
    unsafelyUnwrap(
      await findDirectSignupsByStartTimes([parentStartTime], programItems),
    ),
  ).toHaveLength(0);

  const signups = unsafelyUnwrap(
    await findDirectSignupsByStartTimes(
      [testProgramItem.startTime],
      programItems,
    ),
  );

  expect(signups).toHaveLength(1);
  expect(signups[0].programItemId).toEqual(testProgramItem.programItemId);
  expect(signups[0].username).toEqual(mockUser.username);
});

// Usernames are validated for length only, so one can start with "$". Inside an
// aggregation pipeline that is a field path unless the value is marked as data.
const dollarPrefixedUsername = "$admin";

test("should delete a direct sign-up from a user whose name starts with $", async () => {
  await saveProgramItems([testProgramItem]);
  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    username: dollarPrefixedUsername,
  });

  unsafelyUnwrap(
    await delDirectSignup({
      username: dollarPrefixedUsername,
      directSignupProgramItemId: testProgramItem.programItemId,
    }),
  );

  const signups = unsafelyUnwrap(await findDirectSignups());
  expect(signups[0].userSignups).toHaveLength(0);
  expect(signups[0].count).toEqual(0);
});

test("should bulk delete direct sign-ups from a user whose name starts with $", async () => {
  await saveProgramItems([testProgramItem]);
  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    username: dollarPrefixedUsername,
  });

  // The bulk delete reports success whether or not it matched, so prove there was something
  // to remove - otherwise the assertions below hold with the pipeline never running
  const savedSignups = unsafelyUnwrap(await findDirectSignups());
  expect(savedSignups[0].userSignups).toHaveLength(1);

  unsafelyUnwrap(
    await delDirectSignups([
      {
        username: dollarPrefixedUsername,
        directSignupProgramItemId: testProgramItem.programItemId,
      },
    ]),
  );

  const signups = unsafelyUnwrap(await findDirectSignups());
  expect(signups[0].userSignups).toHaveLength(0);
  expect(signups[0].count).toEqual(0);
});

test("should count existing attendees against maxAttendance when appending", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveUser(mockUser3);
  await saveProgramItems([{ ...testProgramItem, maxAttendance: 2 }]);

  // One spot already taken, so only one of the two new sign-ups fits
  await saveDirectSignup(mockPostDirectSignupRequest);

  const programItems = unsafelyUnwrap(await findProgramItems());
  const response = unsafelyUnwrap(
    await saveDirectSignups(
      [
        { ...mockPostDirectSignupRequest, username: mockUser2.username },
        { ...mockPostDirectSignupRequest, username: mockUser3.username },
      ],
      programItems,
    ),
  );

  expect(response.droppedSignups).toHaveLength(1);

  const signupsAfterSave = unsafelyUnwrap(await findDirectSignups());
  expect(signupsAfterSave[0].userSignups).toHaveLength(2);
  expect(signupsAfterSave[0].count).toEqual(2);
});

test("should report the assignment's direct sign-ups as dropped when the program item has no direct sign-up document", async () => {
  // The write updates an existing document and never creates one, so a program item without
  // one stores nothing - and saying otherwise sends an acceptance email for a spot that is
  // not there, which the append-only event log makes permanent
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);
  unsafelyUnwrap(await removeDirectSignups());

  const programItems = unsafelyUnwrap(await findProgramItems());
  const response = unsafelyUnwrap(
    await saveDirectSignups([mockPostDirectSignupRequest], programItems),
  );

  expect(response.droppedSignups).toEqual([mockPostDirectSignupRequest]);
  expect(unsafelyUnwrap(await findDirectSignups())).toEqual([]);
});

test("should treat an assignment's direct sign-ups as saved when the sign-up document cannot be read", async () => {
  // A document that is there but unreadable says nothing about what the write stored, so
  // reporting its sign-ups dropped would tell attendees holding a spot that they got none
  const programItem = { ...testProgramItem, maxAttendance: 5 };
  await saveUser(mockUser);
  await saveProgramItems([programItem]);
  unsafelyUnwrap(await removeDirectSignups());

  // Inserted through the driver so the entry keeps a shape the read schema rejects. The write
  // below leaves it in place, so the document is still unreadable when the check runs
  await SignupModel.collection.insertOne({
    programItemId: programItem.programItemId,
    userSignups: [{ username: 42 }],
    count: 1,
  });

  const response = unsafelyUnwrap(
    await saveDirectSignups([mockPostDirectSignupRequest], [programItem]),
  );

  expect(response.droppedSignups).toEqual([]);

  // The document really is unreadable, and the write really did land in it
  expect(unsafelyUnwrap(await findDirectSignups())).toEqual([]);
  const stored = await SignupModel.collection.findOne({
    programItemId: programItem.programItemId,
  });
  expect(stored?.userSignups).toHaveLength(2);
});

test("should keep existing direct sign-ups when the empty sign-up document is created again", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);
  await saveDirectSignup(mockPostDirectSignupRequest);

  unsafelyUnwrap(
    await createEmptyDirectSignupDocumentForProgramItems([
      testProgramItem.programItemId,
    ]),
  );

  const signups = unsafelyUnwrap(await findDirectSignups());
  expect(signups).toHaveLength(1);
  expect(signups[0].userSignups).toHaveLength(1);
  expect(signups[0].count).toEqual(1);
});

test("should create the sign-up document once when two callers create it at the same time", async () => {
  await saveProgramItems([testProgramItem]);
  unsafelyUnwrap(await removeDirectSignups());

  const [first, second] = await Promise.all([
    createEmptyDirectSignupDocumentForProgramItems([
      testProgramItem.programItemId,
    ]),
    createEmptyDirectSignupDocumentForProgramItems([
      testProgramItem.programItemId,
    ]),
  ]);

  // Losing the race means the document is there, which is what the caller wanted
  expect(first.ok).toEqual(true);
  expect(second.ok).toEqual(true);
  expect(unsafelyUnwrap(await findDirectSignups())).toHaveLength(1);
});

test("should create the sign-up documents in one unordered batch", async () => {
  // Weaker than the tests around it, and deliberately so: what this guards is a concurrent insert
  // aborting the rest of an ordered batch, which needs a real race to reproduce. The option is
  // the whole mechanism, so pin that instead
  const bulkWrite = vi.spyOn(SignupModel, "bulkWrite");
  await saveProgramItems([testProgramItem]);

  expect(bulkWrite).toHaveBeenCalledWith(expect.anything(), { ordered: false });
});

test("should treat a duplicate key error as the sign-up document already existing", async () => {
  // The race above is not guaranteed to interleave, so drive the branch directly
  vi.spyOn(SignupModel, "bulkWrite").mockRejectedValue({
    writeErrors: [{ code: 11000 }],
  });

  const response = await createEmptyDirectSignupDocumentForProgramItems([
    testProgramItem.programItemId,
  ]);

  expect(response.ok).toEqual(true);
});

test("should report a write failure that is not a duplicate key", async () => {
  vi.spyOn(SignupModel, "bulkWrite").mockRejectedValue({
    writeErrors: [{ code: 11000 }, { code: 121 }],
  });

  const response = await createEmptyDirectSignupDocumentForProgramItems([
    testProgramItem.programItemId,
  ]);

  expect(response.ok).toEqual(false);
});

test("should reject a second sign-up document for the same program item", async () => {
  await saveProgramItems([testProgramItem]);

  // Straight at the driver, so only the database's own unique key can stop it
  await expect(
    SignupModel.collection.insertOne({
      programItemId: testProgramItem.programItemId,
      userSignups: [],
      count: 0,
    }),
  ).rejects.toThrow(/duplicate key/);
});

test("should report an assignment's direct sign-up the attendance cap cut from an over-full program item", async () => {
  // Lowering the limit below the attendees already in leaves the program item over-full, and
  // the cap in the write keeps those attendees rather than the sign-up being written over one
  // of them. Nothing was stored for it, so it must not be reported as placed.
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveProgramItems([{ ...testProgramItem, maxAttendance: 2 }]);

  await saveDirectSignup(mockPostDirectSignupRequest);
  await saveDirectSignup({
    ...mockPostDirectSignupRequest,
    username: mockUser2.username,
  });

  // The lottery places somebody already in the program item, so the write rewrites their entry
  // rather than adding one, and drops nothing on its own
  const response = unsafelyUnwrap(
    await saveDirectSignups(
      [mockPostDirectSignupRequest],
      [{ ...testProgramItem, maxAttendance: 1 }],
    ),
  );

  expect(response.droppedSignups).toEqual([mockPostDirectSignupRequest]);

  const signups = unsafelyUnwrap(await findDirectSignups());
  expect(
    signups[0].userSignups.map((userSignup) => userSignup.username),
  ).toEqual([mockUser2.username]);
});

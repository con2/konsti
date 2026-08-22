import { randomUUID } from "node:crypto";
import { Server } from "node:http";
import { addHours, addSeconds, subHours, subMinutes } from "date-fns";
import request, { Test } from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import {
  DeleteDirectSignupRequest,
  PostDirectSignupError,
  PostDirectSignupRequest,
  PostDirectSignupResult,
} from "shared/types/api/myProgramItems";
import {
  ProgramType,
  SignupType,
  State,
} from "shared/types/models/programItem";
import { SignupQuestionType } from "shared/types/models/settings";
import { UserGroup } from "shared/types/models/user";
import {
  findDirectSignups,
  findUserDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import {
  createSettings,
  saveHidden,
  saveSignupQuestion,
} from "server/features/settings/settingsRepository";
import {
  saveGroupCode,
  saveGroupCreator,
} from "server/features/user/group/groupRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockPostDirectSignupRequest,
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
  mockUser5,
} from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { NewUser } from "server/types/userTypes";
import { getJWT } from "server/utils/jwt";
import { closeServer, startServer } from "server/utils/server";

let server: Server;

beforeEach(async () => {
  // Sign-up start defaults to 'eventStartTime' if before
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    eventStartTime: subMinutes(
      new Date(testProgramItem.startTime),
      config.event().preSignupStart,
    ).toISOString(),
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
  });
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: randomUUID(),
  });
});

afterEach(async () => {
  vi.resetAllMocks();
  await closeServer(server);
});

describe(`POST ${ApiEndpoint.DIRECT_SIGNUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.DIRECT_SIGNUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid parameters", async () => {
    const signup: Partial<PostDirectSignupRequest> = {
      directSignupProgramItemId: "ABCD1234",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(422);
  });

  test("should return 422 if signup message is too long", async () => {
    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message:
        "Test message Test message Test message Test message Test message Test message Test message Test message Test message Test message Test message Test message Test message",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(422);
  });

  test("should store first-come-first-served priority regardless of the priority the client sends", async () => {
    vi.setSystemTime(testProgramItem.startTime);
    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);

    // priority is set by the backend; a client-sent lottery-win priority must be ignored
    // so it cannot be made to look like a lottery win
    const signup = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
      priority: 2,
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const signups = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(signups[0].userSignups[0].priority).toEqual(DIRECT_SIGNUP_PRIORITY);
  });

  test("should return error when program item is not found", async () => {
    vi.setSystemTime(
      subHours(new Date(testProgramItem.startTime), 1).toISOString(),
    );
    await saveUser(mockUser);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: "invalid_program_item_id",
      message: "",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupError;
    expect(body.status).toEqual("error");
    expect(body.message).toEqual(
      "Signed program item invalid_program_item_id not found",
    );
  });

  test("should return error when program item is cancelled", async () => {
    await saveProgramItems([{ ...testProgramItem, state: State.CANCELLED }]);
    await saveUser(mockUser);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupError;
    expect(body.status).toEqual("error");
    expect(body.message).toEqual("Program item is cancelled");
  });

  test("should return error when program item is hidden", async () => {
    vi.setSystemTime(testProgramItem.startTime);
    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);
    await saveHidden([testProgramItem.programItemId]);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("hidden");

    const signups = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(signups).toHaveLength(0);
  });

  test("should return error if program doesn't use Konsti signup", async () => {
    await saveProgramItems([
      { ...testProgramItem, signupType: SignupType.OTHER },
    ]);
    await saveUser(mockUser);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupError;
    expect(body.status).toEqual("error");
    expect(body.message).toEqual("No Konsti signup for this program item");
  });

  test("should return error when program item is missing required information", async () => {
    await saveProgramItems([{ ...testProgramItem, maxAttendance: 0 }]);
    await saveUser(mockUser);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("invalidProgramItem");

    const signups = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(signups).toHaveLength(0);
  });

  test("should return error when signup is not yet open", async () => {
    // This test time should land to phaseGap
    vi.setSystemTime(
      subHours(new Date(testProgramItem.startTime), 2).toISOString(),
    );

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("signupNotOpenYet");
  });

  test("should return error when signup is closed", async () => {
    vi.setSystemTime(
      addSeconds(new Date(testProgramItem.startTime), 1).toISOString(),
    );

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("signupEnded");
  });

  test("should return success with valid data", async () => {
    vi.setSystemTime(testProgramItem.startTime);

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);

    const nonModifiedSignups = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(nonModifiedSignups.length).toEqual(0);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "Test message",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupResult;
    expect(body.message).toEqual("Store signup success");
    expect(body.status).toEqual("success");

    const modifiedSignups = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );

    expect(modifiedSignups[0].programItemId).toEqual(
      testProgramItem.programItemId,
    );
    expect(modifiedSignups[0].userSignups[0].message).toEqual("Test message");
  });

  test("should return own signup message when signup question is private", async () => {
    vi.setSystemTime(testProgramItem.startTime);

    await createSettings();
    await saveSignupQuestion({
      programItemId: testProgramItem.programItemId,
      questionFi: "Erityisruokavalio?",
      questionEn: "Dietary restrictions?",
      private: true,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    });
    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "No peanuts",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupResult;
    expect(body.status).toEqual("success");
    // The user's own sign-up keeps the answer, the public attendee list hides it
    expect(body.directSignup?.message).toEqual("No peanuts");
    expect(body.allSignups.userSignups).toEqual([
      { username: mockUser.username, message: "" },
    ]);
  });

  test("should store parent start time as signedToStartTime when program item has parent start time override", async () => {
    // Direct sign-ups store the parent-resolved start time so lottery re-runs can
    // clean them up by matching the shared parent time
    const parentStartTime = addHours(
      new Date(testProgramItem.startTime),
      1,
    ).toISOString();

    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      eventStartTime: subMinutes(
        new Date(testProgramItem.startTime),
        config.event().preSignupStart,
      ).toISOString(),
      twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
      startTimesByParentIds: new Map([
        [testProgramItem.parentId, parentStartTime],
      ]),
    });

    // Sign-up is open: after the parent-derived direct sign-up start, before own end time
    vi.setSystemTime(
      subMinutes(new Date(testProgramItem.startTime), 30).toISOString(),
    );

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "Test message",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupResult;
    expect(body.status).toEqual("success");

    const modifiedSignups = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );

    // signedToStartTime is the parent start time, not the program item own start time
    expect(
      new Date(
        modifiedSignups[0].userSignups[0].signedToStartTime,
      ).toISOString(),
    ).toEqual(parentStartTime);
  });

  test("should not sign too many attendees to program item", async () => {
    vi.setSystemTime(testProgramItem.startTime);

    const maxAttendance = 2;

    await saveProgramItems([{ ...testProgramItem, maxAttendance }]);
    await saveUser(mockUser);
    await saveUser(mockUser2);
    await saveUser(mockUser3);
    await saveUser(mockUser4);
    await saveUser(mockUser5);

    const makeRequest = async (user: NewUser): Promise<Test> => {
      const signup: PostDirectSignupRequest = {
        directSignupProgramItemId: testProgramItem.programItemId,
        message: "Test message",
      };
      return await request(server)
        .post(ApiEndpoint.DIRECT_SIGNUP)
        .send(signup)
        .set(
          "Authorization",
          `Bearer ${getJWT(UserGroup.USER, user.username)}`,
        );
    };

    await Promise.all([
      makeRequest(mockUser),
      makeRequest(mockUser2),
      makeRequest(mockUser3),
      makeRequest(mockUser4),
      makeRequest(mockUser5),
    ]);

    const signups = unsafelyUnwrap(await findDirectSignups());
    const matchingSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(matchingSignup?.userSignups.length).toEqual(maxAttendance);
    expect(matchingSignup?.count).toEqual(maxAttendance);
  });

  test("should not create new signup collection when program item is full", async () => {
    vi.setSystemTime(testProgramItem.startTime);

    const maxAttendance = 2;

    await saveProgramItems([{ ...testProgramItem, maxAttendance }]);
    await saveUser(mockUser);
    await saveUser(mockUser2);
    await saveUser(mockUser3);

    // Save on sign-up -> one seat left
    await saveDirectSignup(mockPostDirectSignupRequest);

    const makeRequest = async (user: NewUser): Promise<Test> => {
      const signup: PostDirectSignupRequest = {
        directSignupProgramItemId: testProgramItem.programItemId,
        message: "Test message",
      };
      return await request(server)
        .post(ApiEndpoint.DIRECT_SIGNUP)
        .send(signup)
        .set(
          "Authorization",
          `Bearer ${getJWT(UserGroup.USER, user.username)}`,
        );
    };

    // Save two more sign-ups at the same time -> one should fail and only one sign-up collection should exist
    await Promise.all([makeRequest(mockUser2), makeRequest(mockUser3)]);

    const signups = unsafelyUnwrap(await findDirectSignups());
    expect(signups).toHaveLength(1);

    const matchingSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(matchingSignup?.userSignups.length).toEqual(maxAttendance);
    expect(matchingSignup?.count).toEqual(maxAttendance);
  });

  test("should remove group member from group when direct signing up to program item", async () => {
    vi.setSystemTime(testProgramItem.startTime);

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);
    await saveGroupCode("group-123", mockUser.username);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupResult;
    expect(body.status).toEqual("success");
    expect(body.leftGroup).toEqual(true);

    const user = unsafelyUnwrap(await findUser(mockUser.username));
    expect(user?.groupCode).toEqual("0");
  });

  test("should close group when group creator direct signs up to program item", async () => {
    vi.setSystemTime(testProgramItem.startTime);

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);
    await saveUser(mockUser2);
    await saveGroupCreator("group-123", true, mockUser.username);
    await saveGroupCode("group-123", mockUser2.username);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupResult;
    expect(body.status).toEqual("success");
    expect(body.leftGroup).toEqual(true);

    // Creator and members are removed from the group
    const creator = unsafelyUnwrap(await findUser(mockUser.username));
    expect(creator?.groupCode).toEqual("0");
    expect(creator?.isGroupCreator).toEqual(false);

    const member = unsafelyUnwrap(await findUser(mockUser2.username));
    expect(member?.groupCode).toEqual("0");
  });

  test("should not disband the group when the direct signup fails because the program item is full", async () => {
    vi.setSystemTime(testProgramItem.startTime);

    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);
    await saveUser(mockUser3);
    await saveGroupCreator("group-123", true, mockUser.username);
    await saveGroupCode("group-123", mockUser2.username);

    // Fill the single seat so the group creator's sign-up below fails
    await saveDirectSignup({
      ...mockPostDirectSignupRequest,
      username: mockUser3.username,
    });

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupResult;
    expect(body.message).toEqual("Program item full");
    expect(body.leftGroup).toEqual(false);

    // The group must remain intact since the sign-up did not happen
    const creator = unsafelyUnwrap(await findUser(mockUser.username));
    expect(creator?.groupCode).toEqual("group-123");
    expect(creator?.isGroupCreator).toEqual(true);

    const member = unsafelyUnwrap(await findUser(mockUser2.username));
    expect(member?.groupCode).toEqual("group-123");
  });

  test("should not remove user from group when signing up to 'signup always open' program item", async () => {
    // A group exists to enter the lottery together, and an always-open program item is not
    // one the lottery allocates - taking a spot in it settles the user for that start time
    // without ending the group's other slots
    // directSignupAlwaysOpenIds makes the program item 'sign-up always open'
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      directSignupAlwaysOpenIds: [testProgramItem.programItemId],
    });
    vi.setSystemTime(testProgramItem.startTime);

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);
    await saveGroupCode("group-123", mockUser.username);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupResult;
    expect(body.status).toEqual("success");
    expect(body.leftGroup).toEqual(false);

    const user = unsafelyUnwrap(await findUser(mockUser.username));
    expect(user?.groupCode).toEqual("group-123");
  });

  test("should cancel lottery signups competing for the same start time", async () => {
    vi.setSystemTime(testProgramItem.startTime);

    // testProgramItem2 starts at the same time as the item being signed up to; the third is an
    // hour later and must survive, since settling is per start time
    const laterStartTime = addHours(
      new Date(testProgramItem.startTime),
      1,
    ).toISOString();
    await saveProgramItems([
      testProgramItem,
      { ...testProgramItem2, startTime: testProgramItem.startTime },
      {
        ...testProgramItem2,
        programItemId: "later-program-item",
        parentId: "later-program-item",
        startTime: laterStartTime,
      },
    ]);
    await saveUser(mockUser);
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        {
          programItemId: testProgramItem2.programItemId,
          priority: 1,
          signedToStartTime: testProgramItem.startTime,
        },
        {
          programItemId: "later-program-item",
          priority: 1,
          signedToStartTime: laterStartTime,
        },
      ],
    });

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupResult;
    expect(body.status).toEqual("success");
    // The response carries what is left so the client doesn't need a second round-trip
    expect(
      body.lotterySignups?.map((lotterySignup) => lotterySignup.programItemId),
    ).toEqual(["later-program-item"]);

    const user = unsafelyUnwrap(await findUser(mockUser.username));
    expect(
      user?.lotterySignups.map((lotterySignup) => lotterySignup.programItemId),
    ).toEqual(["later-program-item"]);
  });

  test("should keep lottery signups when the signup fails because the program item is full", async () => {
    vi.setSystemTime(testProgramItem.startTime);

    await saveProgramItems([
      { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
      { ...testProgramItem2, startTime: testProgramItem.startTime },
    ]);
    await saveUser(mockUser);
    await saveUser(mockUser2);
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        {
          programItemId: testProgramItem2.programItemId,
          priority: 1,
          signedToStartTime: testProgramItem.startTime,
        },
      ],
    });

    // Fill the single spot so mockUser's sign-up below can't land
    await saveDirectSignup({
      ...mockPostDirectSignupRequest,
      username: mockUser2.username,
    });

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupResult;
    expect(body.message).toEqual("Program item full");

    // No spot was taken, so nothing settles the user and their sign-up stands
    const user = unsafelyUnwrap(await findUser(mockUser.username));
    expect(user?.lotterySignups).toHaveLength(1);
  });
});

describe(`DELETE ${ApiEndpoint.DIRECT_SIGNUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).delete(ApiEndpoint.DIRECT_SIGNUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid parameters", async () => {
    const deleteRequest: Partial<DeleteDirectSignupRequest> = {};
    const response = await request(server)
      .delete(ApiEndpoint.DIRECT_SIGNUP)
      .send(deleteRequest)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(422);
  });

  test("should return error when program item is not found", async () => {
    vi.setSystemTime(
      subHours(new Date(testProgramItem.startTime), 1).toISOString(),
    );
    await saveUser(mockUser);

    const deleteRequest: DeleteDirectSignupRequest = {
      directSignupProgramItemId: "invalid_program_item_id",
    };
    const response = await request(server)
      .delete(ApiEndpoint.DIRECT_SIGNUP)
      .send(deleteRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupError;
    expect(body.status).toEqual("error");
    expect(body.message).toEqual(
      "Signed program item invalid_program_item_id not found",
    );
  });

  test("should return error when signup is not found", async () => {
    vi.setSystemTime(testProgramItem.startTime);
    await saveProgramItems([testProgramItem]);

    const deleteRequest: DeleteDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
    };
    const response = await request(server)
      .delete(ApiEndpoint.DIRECT_SIGNUP)
      .send(deleteRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, "user_not_found")}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupError;
    expect(body.status).toEqual("error");
    expect(body.message).toEqual("Delete signup failure");
  });

  test("should return success when user and program item are found", async () => {
    vi.setSystemTime(testProgramItem.startTime);

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);
    await saveDirectSignup(mockPostDirectSignupRequest);

    const nonModifiedSignup = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );

    expect(nonModifiedSignup[0].programItemId).toEqual(
      testProgramItem.programItemId,
    );
    expect(nonModifiedSignup[0].userSignups.length).toEqual(1);

    const deleteRequest: DeleteDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
    };
    const response = await request(server)
      .delete(ApiEndpoint.DIRECT_SIGNUP)
      .send(deleteRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupResult;
    expect(body.message).toEqual("Delete signup success");
    expect(body.status).toEqual("success");

    const modifiedSignup = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(modifiedSignup.length).toEqual(0);
  });
});

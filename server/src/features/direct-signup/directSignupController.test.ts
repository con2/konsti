import { Server } from "node:http";
import { expect, test, afterEach, beforeEach, describe, vi } from "vitest";
import request, { Test } from "supertest";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getJWT } from "server/utils/jwt";
import { UserGroup } from "shared/types/models/user";
import {
  mockPostDirectSignupRequest,
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
  mockUser5,
} from "server/test/mock-data/mockUser";
import { testProgramItem } from "shared/tests/testProgramItem";
import { saveUser } from "server/features/user/userRepository";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import {
  findDirectSignups,
  findUserDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { NewUser } from "server/types/userTypes";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import {
  DeleteDirectSignupRequest,
  PostDirectSignupError,
  PostDirectSignupRequest,
  PostDirectSignupResponse,
} from "shared/types/api/myProgramItems";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { config } from "shared/config";
import {
  ProgramType,
  SignupType,
  State,
} from "shared/types/models/programItem";

let server: Server;

beforeEach(async () => {
  // Signup start defaults to 'eventStartTime' if before
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    eventStartTime: dayjs(testProgramItem.startTime)
      .subtract(config.event().preSignupStart, "minutes")
      .toISOString(),
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
  });
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
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
      priority: DIRECT_SIGNUP_PRIORITY,
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

  test("should return error when program item is not found", async () => {
    vi.setSystemTime(
      dayjs(testProgramItem.startTime).subtract(1, "hour").toISOString(),
    );
    await saveUser(mockUser);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: "invalid_program_item_id",
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
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
      priority: DIRECT_SIGNUP_PRIORITY,
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

  test("should return error if program doesn't use Konsti signup", async () => {
    await saveProgramItems([
      { ...testProgramItem, signupType: SignupType.OTHER },
    ]);
    await saveUser(mockUser);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
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

  test("should return error when signup is not yet open", async () => {
    // This test time should land to phaseGap
    vi.setSystemTime(
      dayjs(testProgramItem.startTime).subtract(2, "hours").toISOString(),
    );

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
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
      dayjs(testProgramItem.startTime).add(1, "second").toISOString(),
    );

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);

    const signup: PostDirectSignupRequest = {
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
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
      priority: DIRECT_SIGNUP_PRIORITY,
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostDirectSignupResponse;
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
        priority: DIRECT_SIGNUP_PRIORITY,
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

    // Save on signup -> one seat left
    await saveDirectSignup(mockPostDirectSignupRequest);

    const makeRequest = async (user: NewUser): Promise<Test> => {
      const signup: PostDirectSignupRequest = {
        directSignupProgramItemId: testProgramItem.programItemId,
        message: "Test message",
        priority: DIRECT_SIGNUP_PRIORITY,
      };
      return await request(server)
        .post(ApiEndpoint.DIRECT_SIGNUP)
        .send(signup)
        .set(
          "Authorization",
          `Bearer ${getJWT(UserGroup.USER, user.username)}`,
        );
    };

    // Save two more signups at the same time -> one should fail and only one signup collection should exist
    await Promise.all([makeRequest(mockUser2), makeRequest(mockUser3)]);

    const signups = unsafelyUnwrap(await findDirectSignups());
    expect(signups).toHaveLength(1);

    const matchingSignup = signups.find(
      (signup) => signup.programItemId === testProgramItem.programItemId,
    );
    expect(matchingSignup?.userSignups.length).toEqual(maxAttendance);
    expect(matchingSignup?.count).toEqual(maxAttendance);
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
      dayjs(testProgramItem.startTime).subtract(1, "hour").toISOString(),
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

    const body = response.body as PostDirectSignupResponse;
    expect(body.message).toEqual("Delete signup success");
    expect(body.status).toEqual("success");

    const modifiedSignup = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(modifiedSignup.length).toEqual(0);
  });
});

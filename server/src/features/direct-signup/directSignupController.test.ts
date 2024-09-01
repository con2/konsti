import { Server } from "http";
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
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";
import {
  findDirectSignups,
  findUserDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { NewUser } from "server/types/userTypes";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import {
  DeleteDirectSignupRequest,
  PostDirectSignupRequest,
} from "shared/types/api/myProgramItems";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import * as signupTimes from "shared/utils/signupTimes";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await closeServer(server);
});

describe(`POST ${ApiEndpoint.DIRECT_SIGNUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.DIRECT_SIGNUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid parameters", async () => {
    const signup: Partial<PostDirectSignupRequest> = {
      username: mockUser.username,
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
      username: mockUser.username,
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
      username: mockUser.username,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("error");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toEqual(
      "Signed program item invalid_program_item_id not found",
    );
  });

  test("should return error when user is not found", async () => {
    vi.setSystemTime(testProgramItem.startTime);
    vi.spyOn(signupTimes, "getDirectSignupStartTime").mockReturnValue(
      dayjs(testProgramItem.startTime),
    );

    await saveProgramItems([testProgramItem]);

    const signup: PostDirectSignupRequest = {
      username: "user_not_found",
      directSignupProgramItemId: testProgramItem.programItemId,
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    };
    const response = await request(server)
      .post(ApiEndpoint.DIRECT_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, "user_not_found")}`,
      );
    expect(response.status).toEqual(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("error");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toEqual("Error finding user");
  });

  test("should return error when signup is not yet open", async () => {
    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);
    await saveTestSettings({
      // This test time should land to phaseGap
      testTime: dayjs(testProgramItem.startTime)
        .subtract(2, "hours")
        .toISOString(),
    });

    const signup: PostDirectSignupRequest = {
      username: mockUser.username,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("error");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.errorId).toEqual("signupNotOpenYet");
  });

  test("should return success when user and program item are found", async () => {
    vi.setSystemTime(testProgramItem.startTime);
    vi.spyOn(signupTimes, "getDirectSignupStartTime").mockReturnValue(
      dayjs(testProgramItem.startTime),
    );

    // Populate database
    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);

    // Check starting conditions
    const nonModifiedSignups = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(nonModifiedSignups.length).toEqual(0);

    // Update direct signups
    const signup: PostDirectSignupRequest = {
      username: mockUser.username,
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

    // Check API response
    expect(response.status).toEqual(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toEqual("Store signup success");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("success");

    // Check database
    const modifiedSignups = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );

    expect(modifiedSignups[0].programItem.programItemId).toEqual(
      testProgramItem.programItemId,
    );
    expect(modifiedSignups[0].userSignups[0].message).toEqual("Test message");
  });

  test("should not sign too many attendees to program item", async () => {
    vi.setSystemTime(testProgramItem.startTime);
    vi.spyOn(signupTimes, "getDirectSignupStartTime").mockReturnValue(
      dayjs(testProgramItem.startTime),
    );
    const maxAttendance = 2;

    // Populate database
    await saveProgramItems([{ ...testProgramItem, maxAttendance }]);
    await saveUser(mockUser);
    await saveUser(mockUser2);
    await saveUser(mockUser3);
    await saveUser(mockUser4);
    await saveUser(mockUser5);

    const makeRequest = async (user: NewUser): Promise<Test> => {
      const signup: PostDirectSignupRequest = {
        username: user.username,
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

    // Check results

    const signups = unsafelyUnwrap(await findDirectSignups());
    const matchingSignup = signups.find(
      (signup) =>
        signup.programItem.programItemId === testProgramItem.programItemId,
    );
    expect(matchingSignup?.userSignups.length).toEqual(maxAttendance);
    expect(matchingSignup?.count).toEqual(maxAttendance);
  });

  test("should not create new signup collection when program item is full", async () => {
    vi.setSystemTime(testProgramItem.startTime);
    vi.spyOn(signupTimes, "getDirectSignupStartTime").mockReturnValue(
      dayjs(testProgramItem.startTime),
    );
    const maxAttendance = 2;

    // Populate database
    await saveProgramItems([{ ...testProgramItem, maxAttendance }]);
    await saveUser(mockUser);
    await saveUser(mockUser2);
    await saveUser(mockUser3);

    // Save on signup -> one seat left
    await saveDirectSignup(mockPostDirectSignupRequest);

    const makeRequest = async (user: NewUser): Promise<Test> => {
      const signup: PostDirectSignupRequest = {
        username: user.username,
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

    // Check results
    const signups = unsafelyUnwrap(await findDirectSignups());
    expect(signups).toHaveLength(1);

    const matchingSignup = signups.find(
      (signup) =>
        signup.programItem.programItemId === testProgramItem.programItemId,
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
    const deleteRequest: Partial<DeleteDirectSignupRequest> = {
      username: "testuser",
    };
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
      username: mockUser.username,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("error");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toEqual(
      "Signed program item invalid_program_item_id not found",
    );
  });

  test("should return error when signup is not found", async () => {
    vi.setSystemTime(testProgramItem.startTime);
    await saveProgramItems([testProgramItem]);

    const deleteRequest: DeleteDirectSignupRequest = {
      username: "user_not_found",
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("error");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toEqual("Delete signup failure");
  });

  test("should return success when user and program item are found", async () => {
    vi.setSystemTime(testProgramItem.startTime);
    vi.spyOn(signupTimes, "getDirectSignupStartTime").mockReturnValue(
      dayjs(testProgramItem.startTime),
    );

    // Populate database
    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);
    await saveDirectSignup(mockPostDirectSignupRequest);

    // Check starting conditions
    const nonModifiedSignup = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );

    expect(nonModifiedSignup[0].programItem.programItemId).toEqual(
      testProgramItem.programItemId,
    );
    expect(nonModifiedSignup[0].userSignups.length).toEqual(1);

    // Update direct signups
    const deleteRequest: DeleteDirectSignupRequest = {
      username: mockUser.username,
      directSignupProgramItemId: testProgramItem.programItemId,
    };
    const response = await request(server)
      .delete(ApiEndpoint.DIRECT_SIGNUP)
      .send(deleteRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    // Check API response
    expect(response.status).toEqual(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toEqual("Delete signup success");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("success");

    // Check database
    const modifiedSignup = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(modifiedSignup.length).toEqual(0);
  });
});

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
  mockPostEnteredGameRequest,
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
  mockUser5,
} from "server/test/mock-data/mockUser";
import { testGame } from "shared/tests/testGame";
import { saveUser } from "server/features/user/userRepository";
import { saveGames } from "server/features/game/gameRepository";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";
import {
  findSignups,
  findUserSignups,
  saveSignup,
} from "server/features/signup/signupRepository";
import { NewUser } from "server/types/userTypes";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import {
  DeleteEnteredGameRequest,
  PostEnteredGameRequest,
} from "shared/types/api/myGames";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import * as signupTimes from "shared/utils/signupTimes";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
    enableSentry: false,
  });
});

afterEach(async () => {
  await closeServer(server);
});

describe(`POST ${ApiEndpoint.SIGNUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.SIGNUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid parameters", async () => {
    const signup: Partial<PostEnteredGameRequest> = {
      username: mockUser.username,
      enteredGameId: "ABCD1234",
    };
    const response = await request(server)
      .post(ApiEndpoint.SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(422);
  });

  test("should return 422 if signup message is too long", async () => {
    const signup: PostEnteredGameRequest = {
      username: mockUser.username,
      enteredGameId: testGame.gameId,
      startTime: testGame.startTime,
      message:
        "Test message Test message Test message Test message Test message Test message Test message Test message Test message Test message Test message Test message Test message",
      priority: DIRECT_SIGNUP_PRIORITY,
    };
    const response = await request(server)
      .post(ApiEndpoint.SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(422);
  });

  test("should return error when game is not found", async () => {
    vi.setSystemTime(
      dayjs(testGame.startTime).subtract(1, "hour").toISOString(),
    );
    await saveUser(mockUser);

    const signup: PostEnteredGameRequest = {
      username: mockUser.username,
      enteredGameId: "invalid_game_id",
      startTime: dayjs(testGame.startTime).subtract(1, "hour").toISOString(),
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    };
    const response = await request(server)
      .post(ApiEndpoint.SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("error");
    expect(response.body.message).toEqual("Signed game not found");
  });

  test("should return error when user is not found", async () => {
    vi.setSystemTime(testGame.startTime);
    vi.spyOn(signupTimes, "getDirectSignupStartTime").mockReturnValue(
      dayjs(testGame.startTime),
    );

    await saveGames([testGame]);

    const signup: PostEnteredGameRequest = {
      username: "user_not_found",
      enteredGameId: testGame.gameId,
      startTime: testGame.startTime,
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    };
    const response = await request(server)
      .post(ApiEndpoint.SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, "user_not_found")}`,
      );
    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("error");
    expect(response.body.message).toEqual("Error finding user");
  });

  test("should return error when signup is not yet open", async () => {
    await saveGames([testGame]);
    await saveUser(mockUser);
    await saveTestSettings({
      // This test time should land to phaseGap
      testTime: dayjs(testGame.startTime).subtract(2, "hours").toISOString(),
    });

    const signup: PostEnteredGameRequest = {
      username: mockUser.username,
      enteredGameId: testGame.gameId,
      startTime: testGame.startTime,
      message: "",
      priority: DIRECT_SIGNUP_PRIORITY,
    };
    const response = await request(server)
      .post(ApiEndpoint.SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("error");
    expect(response.body.errorId).toEqual("signupNotOpenYet");
  });

  test("should return success when user and game are found", async () => {
    vi.setSystemTime(testGame.startTime);
    vi.spyOn(signupTimes, "getDirectSignupStartTime").mockReturnValue(
      dayjs(testGame.startTime),
    );

    // Populate database
    await saveGames([testGame]);
    await saveUser(mockUser);

    // Check starting conditions
    const nonModifiedSignupsResult = await findUserSignups(mockUser.username);
    const nonModifiedSignups = unsafelyUnwrapResult(nonModifiedSignupsResult);
    expect(nonModifiedSignups.length).toEqual(0);

    // Update entered games
    const signup: PostEnteredGameRequest = {
      username: mockUser.username,
      enteredGameId: testGame.gameId,
      startTime: testGame.startTime,
      message: "Test message",
      priority: DIRECT_SIGNUP_PRIORITY,
    };
    const response = await request(server)
      .post(ApiEndpoint.SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    // Check API response
    expect(response.status).toEqual(200);
    expect(response.body.message).toEqual("Store signup success");
    expect(response.body.status).toEqual("success");

    // Check database
    const modifiedSignupsResult = await findUserSignups(mockUser.username);
    const modifiedSignups = unsafelyUnwrapResult(modifiedSignupsResult);

    expect(modifiedSignups[0].game.gameId).toEqual(testGame.gameId);
    expect(modifiedSignups[0].userSignups[0].message).toEqual("Test message");
  });

  test("should not sign too many players to game", async () => {
    vi.setSystemTime(testGame.startTime);
    vi.spyOn(signupTimes, "getDirectSignupStartTime").mockReturnValue(
      dayjs(testGame.startTime),
    );
    const maxAttendance = 2;

    // Populate database
    await saveGames([{ ...testGame, maxAttendance }]);
    await saveUser(mockUser);
    await saveUser(mockUser2);
    await saveUser(mockUser3);
    await saveUser(mockUser4);
    await saveUser(mockUser5);

    const makeRequest = async (user: NewUser): Promise<Test> => {
      const signup: PostEnteredGameRequest = {
        username: user.username,
        enteredGameId: testGame.gameId,
        startTime: testGame.startTime,
        message: "Test message",
        priority: DIRECT_SIGNUP_PRIORITY,
      };
      return await request(server)
        .post(ApiEndpoint.SIGNUP)
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

    const signupsResult = await findSignups();
    const signups = unsafelyUnwrapResult(signupsResult);
    const matchingSignup = signups.find(
      (signup) => signup.game.gameId === testGame.gameId,
    );
    expect(matchingSignup?.userSignups.length).toEqual(maxAttendance);
    expect(matchingSignup?.count).toEqual(maxAttendance);
  });

  test("should not create new signup collection when program item is full", async () => {
    vi.setSystemTime(testGame.startTime);
    vi.spyOn(signupTimes, "getDirectSignupStartTime").mockReturnValue(
      dayjs(testGame.startTime),
    );
    const maxAttendance = 2;

    // Populate database
    await saveGames([{ ...testGame, maxAttendance }]);
    await saveUser(mockUser);
    await saveUser(mockUser2);
    await saveUser(mockUser3);

    // Save on signup -> one seat left
    await saveSignup(mockPostEnteredGameRequest);

    const makeRequest = async (user: NewUser): Promise<Test> => {
      const signup: PostEnteredGameRequest = {
        username: user.username,
        enteredGameId: testGame.gameId,
        startTime: testGame.startTime,
        message: "Test message",
        priority: DIRECT_SIGNUP_PRIORITY,
      };
      return await request(server)
        .post(ApiEndpoint.SIGNUP)
        .send(signup)
        .set(
          "Authorization",
          `Bearer ${getJWT(UserGroup.USER, user.username)}`,
        );
    };

    // Save two more signups at the same time -> one should fail and only one signup collection should exist
    await Promise.all([makeRequest(mockUser2), makeRequest(mockUser3)]);

    // Check results
    const signupsResult = await findSignups();
    const signups = unsafelyUnwrapResult(signupsResult);
    expect(signups).toHaveLength(1);

    const matchingSignup = signups.find(
      (signup) => signup.game.gameId === testGame.gameId,
    );
    expect(matchingSignup?.userSignups.length).toEqual(maxAttendance);
    expect(matchingSignup?.count).toEqual(maxAttendance);
  });
});

describe(`DELETE ${ApiEndpoint.SIGNUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).delete(ApiEndpoint.SIGNUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid parameters", async () => {
    const deleteRequest: Partial<DeleteEnteredGameRequest> = {
      username: "testuser",
      enteredGameId: "ABCD1234",
    };
    const response = await request(server)
      .delete(ApiEndpoint.SIGNUP)
      .send(deleteRequest)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(422);
  });

  test("should return error when game is not found", async () => {
    vi.setSystemTime(
      dayjs(testGame.startTime).subtract(1, "hour").toISOString(),
    );
    await saveUser(mockUser);

    const deleteRequest: DeleteEnteredGameRequest = {
      username: mockUser.username,
      enteredGameId: "invalid_game_id",
      startTime: dayjs(testGame.startTime).subtract(1, "hour").toISOString(),
    };
    const response = await request(server)
      .delete(ApiEndpoint.SIGNUP)
      .send(deleteRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("error");
    expect(response.body.message).toEqual("Delete signup failure");
  });

  test("should return error when signup is not found", async () => {
    vi.setSystemTime(testGame.startTime);
    await saveGames([testGame]);

    const deleteRequest: DeleteEnteredGameRequest = {
      username: "user_not_found",
      enteredGameId: testGame.gameId,
      startTime: testGame.startTime,
    };
    const response = await request(server)
      .delete(ApiEndpoint.SIGNUP)
      .send(deleteRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, "user_not_found")}`,
      );
    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("error");
    expect(response.body.message).toEqual("Delete signup failure");
  });

  test("should return success when user and game are found", async () => {
    vi.setSystemTime(testGame.startTime);
    vi.spyOn(signupTimes, "getDirectSignupStartTime").mockReturnValue(
      dayjs(testGame.startTime),
    );

    // Populate database
    await saveGames([testGame]);
    await saveUser(mockUser);
    await saveSignup(mockPostEnteredGameRequest);

    // Check starting conditions
    const nonModifiedSignupResult = await findUserSignups(mockUser.username);
    const nonModifiedSignup = unsafelyUnwrapResult(nonModifiedSignupResult);

    expect(nonModifiedSignup[0].game.gameId).toEqual(testGame.gameId);
    expect(nonModifiedSignup[0].userSignups.length).toEqual(1);

    // Update entered games
    const deleteRequest: DeleteEnteredGameRequest = {
      username: mockUser.username,
      enteredGameId: testGame.gameId,
      startTime: testGame.startTime,
    };
    const response = await request(server)
      .delete(ApiEndpoint.SIGNUP)
      .send(deleteRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    // Check API response
    expect(response.status).toEqual(200);
    expect(response.body.message).toEqual("Delete signup success");
    expect(response.body.status).toEqual("success");

    // Check database
    const modifiedSignupResult = await findUserSignups(mockUser.username);
    const modifiedSignup = unsafelyUnwrapResult(modifiedSignupResult);
    expect(modifiedSignup.length).toEqual(0);
  });
});

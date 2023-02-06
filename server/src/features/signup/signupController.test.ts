import { Server } from "http";
import request, { Test } from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getJWT } from "server/utils/jwt";
import { UserGroup } from "shared/typings/models/user";
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
import { NewUser } from "server/typings/user.typings";

let server: Server;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  server = await startServer({
    dbConnString: mongoServer.getUri(),
    dbName: faker.random.alphaNumeric(10),
  });
});

afterEach(async () => {
  await closeServer(server);
});

afterAll(async () => {
  await mongoServer.stop();
});

describe(`POST ${ApiEndpoint.SIGNUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.SIGNUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid parameters", async () => {
    const response = await request(server)
      .post(ApiEndpoint.SIGNUP)
      .send({
        username: mockUser.username,
        enteredGameId: "ABCD1234",
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );
    expect(response.status).toEqual(422);
  });

  test("should return 422 if signup message is too long", async () => {
    const response = await request(server)
      .post(ApiEndpoint.SIGNUP)
      .send({
        username: mockUser.username,
        enteredGameId: testGame.gameId,
        startTime: testGame.startTime,
        message:
          "Test message Test message Test message Test message Test message Test message Test message Test message Test message Test message Test message Test message Test message",
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );
    expect(response.status).toEqual(422);
  });

  test("should return error when game is not found", async () => {
    await saveUser(mockUser);

    const response = await request(server)
      .post(ApiEndpoint.SIGNUP)
      .send({
        username: mockUser.username,
        enteredGameId: "invalid_game_id",
        startTime: "2019-07-26T13:00:00Z",
        message: "",
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );
    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("error");
    expect(response.body.message).toEqual("Signed game not found");
  });

  test("should return error when user is not found", async () => {
    await saveGames([testGame]);

    const response = await request(server)
      .post(ApiEndpoint.SIGNUP)
      .send({
        username: "user_not_found",
        enteredGameId: testGame.gameId,
        startTime: testGame.startTime,
        message: "",
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, "user_not_found")}`
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
      testTime: dayjs(testGame.startTime).subtract(2, "hours").format(),
    });

    const response = await request(server)
      .post(ApiEndpoint.SIGNUP)
      .send({
        username: mockUser.username,
        enteredGameId: testGame.gameId,
        startTime: testGame.startTime,
        message: "",
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );

    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("error");
    expect(response.body.errorId).toEqual("signupNotOpenYet");
  });

  test("should return success when user and game are found", async () => {
    // Populate database
    await saveGames([testGame]);
    await saveUser(mockUser);

    // Check starting conditions
    const nonModifiedSignups = await findUserSignups(mockUser.username);
    expect(nonModifiedSignups?.length).toEqual(0);

    // Update entered games
    const response = await request(server)
      .post(ApiEndpoint.SIGNUP)
      .send({
        username: mockUser.username,
        enteredGameId: testGame.gameId,
        startTime: testGame.startTime,
        message: "Test message",
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );

    // Check API response
    expect(response.status).toEqual(200);
    expect(response.body.message).toEqual("Store signup success");
    expect(response.body.status).toEqual("success");

    // Check database
    const modifiedSignups = await findUserSignups(mockUser.username);

    expect(modifiedSignups?.[0].game.gameId).toEqual(testGame.gameId);
    expect(modifiedSignups?.[0].userSignups[0].message).toEqual("Test message");
  });

  test("should not sign too many players to game", async () => {
    const maxAttendance = 2;

    // Populate database
    await saveGames([{ ...testGame, maxAttendance }]);
    await saveUser(mockUser);
    await saveUser(mockUser2);
    await saveUser(mockUser3);
    await saveUser(mockUser4);
    await saveUser(mockUser5);

    const makeRequest = async (user: NewUser): Promise<Test> => {
      return await request(server)
        .post(ApiEndpoint.SIGNUP)
        .send({
          username: user.username,
          enteredGameId: testGame.gameId,
          startTime: testGame.startTime,
          message: "Test message",
        })
        .set(
          "Authorization",
          `Bearer ${getJWT(UserGroup.USER, user.username)}`
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

    const signups = await findSignups();
    const matchingSignup = signups?.find(
      (signup) => signup.game.gameId === testGame.gameId
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
    const response = await request(server)
      .delete(ApiEndpoint.SIGNUP)
      .send({
        username: "testuser",
        enteredGameId: "ABCD1234",
      })
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(422);
  });

  test("should return error when game is not found", async () => {
    await saveUser(mockUser);

    const response = await request(server)
      .delete(ApiEndpoint.SIGNUP)
      .send({
        username: mockUser.username,
        enteredGameId: "invalid_game_id",
        startTime: "2019-07-26T13:00:00Z",
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );
    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("error");
    expect(response.body.message).toEqual("Delete signup failure");
  });

  test("should return error when signup is not found", async () => {
    await saveGames([testGame]);

    const response = await request(server)
      .delete(ApiEndpoint.SIGNUP)
      .send({
        username: "user_not_found",
        enteredGameId: testGame.gameId,
        startTime: testGame.startTime,
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, "user_not_found")}`
      );
    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("error");
    expect(response.body.message).toEqual("Delete signup failure");
  });

  test("should return success when user and game are found", async () => {
    // Populate database
    await saveGames([testGame]);
    await saveUser(mockUser);
    await saveSignup(mockPostEnteredGameRequest);

    // Check starting conditions
    const nonModifiedSignup = await findUserSignups(mockUser.username);

    expect(nonModifiedSignup?.[0].game.gameId).toEqual(testGame.gameId);
    expect(nonModifiedSignup?.[0].userSignups.length).toEqual(1);

    // Update entered games
    const response = await request(server)
      .delete(ApiEndpoint.SIGNUP)
      .send({
        username: mockUser.username,
        enteredGameId: testGame.gameId,
        startTime: testGame.startTime,
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );

    // Check API response
    expect(response.status).toEqual(200);
    expect(response.body.message).toEqual("Delete signup success");
    expect(response.body.status).toEqual("success");

    // Check database
    const modifiedSignup = await findUserSignups(mockUser.username);
    expect(modifiedSignup?.length).toEqual(0);
  });
});

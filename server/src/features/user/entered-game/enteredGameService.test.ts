import { Server } from "http";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { startServer, closeServer } from "server/utils/server";
import { ENTERED_GAME_ENDPOINT } from "shared/constants/apiEndpoints";
import { getJWT } from "server/utils/jwt";
import { UserGroup } from "shared/typings/models/user";
import {
  mockUser,
  mockUser2,
  mockUser3,
  mockUser4,
  mockUser5,
} from "server/test/mock-data/mockUser";
import { testGame } from "shared/tests/testGame";
import { findUser, saveUser } from "server/features/user/userRepository";
import { findGames, saveGames } from "server/features/game/gameRepository";

let server: Server;
let mongoServer: MongoMemoryServer;
let mongoUri: string;

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  await mongoServer.start();
  mongoUri = mongoServer.getUri();
  server = await startServer(mongoUri);
});

afterEach(async () => {
  await closeServer(server);
  await mongoServer.stop();
});

describe(`POST ${ENTERED_GAME_ENDPOINT}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ENTERED_GAME_ENDPOINT);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid parameters", async () => {
    const response = await request(server)
      .post(ENTERED_GAME_ENDPOINT)
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
      .post(ENTERED_GAME_ENDPOINT)
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
      .post(ENTERED_GAME_ENDPOINT)
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
  });

  test("should return error when user is not found", async () => {
    await saveGames([testGame]);

    const response = await request(server)
      .post(ENTERED_GAME_ENDPOINT)
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
  });

  test("should return success when user and game are found", async () => {
    // Populate database
    await saveGames([testGame]);
    await saveUser(mockUser);

    // Check starting conditions
    const nonModifiedUser = await findUser(mockUser.username);
    expect(nonModifiedUser?.enteredGames.length).toEqual(0);

    // Update entered games
    const response = await request(server)
      .post(ENTERED_GAME_ENDPOINT)
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
    expect(response.body.message).toEqual("Store entered game success");
    expect(response.body.status).toEqual("success");

    // Check database
    const modifiedUser = await findUser(mockUser.username);
    expect(modifiedUser?.enteredGames[0].gameDetails.gameId).toEqual(
      testGame.gameId
    );
    expect(modifiedUser?.enteredGames[0].message).toEqual("Test message");
  });

  test("should return error when game is full", async () => {
    // Populate database
    await saveGames([testGame]);
    await saveUser(mockUser);
    await saveUser(mockUser2);
    await saveUser(mockUser3);
    await saveUser(mockUser4);
    await saveUser(mockUser5);

    // SIGNUP 1

    const response = await request(server)
      .post(ENTERED_GAME_ENDPOINT)
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

    expect(response.status).toEqual(200);
    expect(response.body.message).toEqual("Store entered game success");
    expect(response.body.status).toEqual("success");

    // SIGNUP 2

    const response2 = await request(server)
      .post(ENTERED_GAME_ENDPOINT)
      .send({
        username: mockUser2.username,
        enteredGameId: testGame.gameId,
        startTime: testGame.startTime,
        message: "Test message",
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`
      );

    expect(response2.status).toEqual(200);
    expect(response2.body.message).toEqual("Store entered game success");
    expect(response2.body.status).toEqual("success");

    // SIGNUP 3

    const response3 = await request(server)
      .post(ENTERED_GAME_ENDPOINT)
      .send({
        username: mockUser3.username,
        enteredGameId: testGame.gameId,
        startTime: testGame.startTime,
        message: "Test message",
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser3.username)}`
      );

    expect(response3.status).toEqual(200);
    expect(response3.body.message).toEqual("Store entered game success");
    expect(response3.body.status).toEqual("success");

    // SIGNUP 4

    const response4 = await request(server)
      .post(ENTERED_GAME_ENDPOINT)
      .send({
        username: mockUser4.username,
        enteredGameId: testGame.gameId,
        startTime: testGame.startTime,
        message: "Test message",
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser4.username)}`
      );

    expect(response4.status).toEqual(200);
    expect(response4.body.message).toEqual("Store entered game success");
    expect(response4.body.status).toEqual("success");

    // SIGNUP 5

    const response5 = await request(server)
      .post(ENTERED_GAME_ENDPOINT)
      .send({
        username: mockUser5.username,
        enteredGameId: testGame.gameId,
        startTime: testGame.startTime,
        message: "Test message",
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser5.username)}`
      );

    expect(response5.status).toEqual(200);
    expect(response5.body.message).toEqual("Entered game is full");
    expect(response5.body.status).toEqual("error");
    expect(response5.body.code).toEqual(51);

    // Check results

    const modifiedUser = await findUser(mockUser.username);
    expect(modifiedUser?.enteredGames[0].gameDetails.gameId).toEqual(
      testGame.gameId
    );

    const modifiedUser2 = await findUser(mockUser2.username);
    expect(modifiedUser2?.enteredGames[0].gameDetails.gameId).toEqual(
      testGame.gameId
    );

    const modifiedUser3 = await findUser(mockUser3.username);
    expect(modifiedUser3?.enteredGames[0].gameDetails.gameId).toEqual(
      testGame.gameId
    );

    const modifiedUser4 = await findUser(mockUser4.username);
    expect(modifiedUser4?.enteredGames[0].gameDetails.gameId).toEqual(
      testGame.gameId
    );

    const modifiedUser5 = await findUser(mockUser5.username);
    expect(modifiedUser5?.enteredGames.length).toEqual(0);
  });
});

describe(`DELETE ${ENTERED_GAME_ENDPOINT}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).delete(ENTERED_GAME_ENDPOINT);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid parameters", async () => {
    const response = await request(server)
      .delete(ENTERED_GAME_ENDPOINT)
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
      .delete(ENTERED_GAME_ENDPOINT)
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
  });

  test("should return error when user is not found", async () => {
    await saveGames([testGame]);

    const response = await request(server)
      .delete(ENTERED_GAME_ENDPOINT)
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
  });

  test("should return success when user and game are found", async () => {
    // Populate database
    await saveGames([testGame]);
    const games = await findGames();

    const mockUserWithEnteredGame = {
      ...mockUser,
      enteredGames: [
        {
          gameDetails: games[0]._id,
          priority: 1,
          time: testGame.startTime,
          message: "Test message",
        },
      ],
    };

    await saveUser(mockUserWithEnteredGame);

    // Check starting conditions
    const nonModifiedUser = await findUser(mockUser.username);
    expect(nonModifiedUser?.enteredGames.length).toEqual(1);

    // Update entered games
    const response = await request(server)
      .delete(ENTERED_GAME_ENDPOINT)
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
    expect(response.body.message).toEqual("Delete entered game success");
    expect(response.body.status).toEqual("success");

    // Check database
    const modifiedUser = await findUser(mockUser.username);
    expect(modifiedUser?.enteredGames.length).toEqual(0);
  });
});

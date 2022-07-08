import { Server } from "http";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import dayjs from "dayjs";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  CloseGroupRequest,
  CreateGroupRequest,
  JoinGroupRequest,
  LeaveGroupRequest,
} from "shared/typings/api/groups";
import { UserGroup } from "shared/typings/models/user";
import { getJWT } from "server/utils/jwt";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockPostEnteredGameRequest,
  mockSignedGames,
  mockUser,
  mockUser2,
} from "server/test/mock-data/mockUser";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { saveGames } from "server/features/game/gameRepository";
import { testGame, testGame2 } from "shared/tests/testGame";
import { closeServer, startServer } from "server/utils/server";
import { saveSignup } from "server/features/signup/signupRepository";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";

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

describe(`GET ${ApiEndpoint.GROUP}`, () => {
  test("should return 422 without valid body", async () => {
    const response = await request(server).get(ApiEndpoint.GROUP);
    expect(response.status).toEqual(422);
  });

  test("should return 401 without valid authorization", async () => {
    const response = await request(server).get(ApiEndpoint.GROUP).query({
      username: "testuser",
      groupCode: "1234",
    });
    expect(response.status).toEqual(401);
  });

  test("should return group members", async () => {
    await saveGames([testGame]);
    await saveUser({ ...mockUser, groupCode: mockUser.serial });
    await saveUser({ ...mockUser2, groupCode: mockUser.serial });
    await saveSignup({
      ...mockPostEnteredGameRequest,
      username: mockUser2.username,
    });

    const response = await request(server)
      .get(ApiEndpoint.GROUP)
      .query({
        username: mockUser2.username,
        groupCode: mockUser.serial,
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`
      );

    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("success");
    expect(response.body.results.length).toEqual(2);
  });
});

describe(`POST ${ApiEndpoint.GROUP}`, () => {
  test("should return 422 without valid body", async () => {
    const response = await request(server).post(ApiEndpoint.GROUP);
    expect(response.status).toEqual(422);
  });

  test("should return 401 without valid authorization", async () => {
    const groupRequest: CreateGroupRequest = {
      groupCode: "1234",
      username: "testuser",
    };

    const response = await request(server)
      .post(ApiEndpoint.GROUP)
      .send(groupRequest);
    expect(response.status).toEqual(401);
  });

  test("should create group", async () => {
    const user = await saveUser(mockUser);
    expect(user.groupCode).toEqual("0");

    const groupRequest: CreateGroupRequest = {
      groupCode: mockUser.serial,
      username: mockUser.username,
    };

    const response = await request(server)
      .post(ApiEndpoint.GROUP)
      .send(groupRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );

    expect(response.status).toEqual(200);
    const updatedUser = await findUser(mockUser.username);
    expect(updatedUser?.groupCode).toEqual(user.serial);
  });
});

describe(`POST ${ApiEndpoint.JOIN_GROUP}`, () => {
  test("should return 422 without valid body", async () => {
    const response = await request(server).post(ApiEndpoint.JOIN_GROUP);
    expect(response.status).toEqual(422);
  });

  test("should return 401 without valid authorization", async () => {
    const groupRequest: JoinGroupRequest = {
      groupCode: "1234",
      ownSerial: "1234",
      username: "testuser",
    };

    const response = await request(server)
      .post(ApiEndpoint.JOIN_GROUP)
      .send(groupRequest);
    expect(response.status).toEqual(401);
  });

  test("should join group", async () => {
    await saveGames([testGame, testGame2]);
    await saveUser({ ...mockUser, groupCode: mockUser.serial });
    await saveUser(mockUser2);
    const userWithSignups = await saveSignedGames({
      signedGames: mockSignedGames,
      username: mockUser2.username,
    });
    expect(userWithSignups.signedGames.length).toEqual(2);

    const groupRequest: JoinGroupRequest = {
      groupCode: mockUser.serial,
      ownSerial: mockUser2.serial,
      username: mockUser2.username,
    };

    const response = await request(server)
      .post(ApiEndpoint.JOIN_GROUP)
      .send(groupRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`
      );

    expect(response.status).toEqual(200);
    const updatedUser = await findUser(mockUser2.username);
    expect(updatedUser?.groupCode).toEqual(mockUser.serial);
    expect(updatedUser?.signedGames.length).toEqual(0);
  });

  test("should return error if existing upcoming signups", async () => {
    await saveTestSettings({
      testTime: dayjs(testGame.startTime).subtract(2, "hours").format(),
    });

    await saveGames([testGame]);
    await saveUser({ ...mockUser, groupCode: mockUser.serial });
    await saveUser(mockUser2);
    await saveSignup({
      ...mockPostEnteredGameRequest,
      username: mockUser2.username,
    });

    const groupRequest: JoinGroupRequest = {
      groupCode: mockUser.serial,
      ownSerial: mockUser2.serial,
      username: mockUser2.username,
    };

    const response = await request(server)
      .post(ApiEndpoint.JOIN_GROUP)
      .send(groupRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`
      );

    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("error");
    expect(response.body.message).toEqual("Signup in future");
  });
});

describe(`POST ${ApiEndpoint.LEAVE_GROUP}`, () => {
  test("should return 422 without valid body", async () => {
    const response = await request(server).post(ApiEndpoint.LEAVE_GROUP);
    expect(response.status).toEqual(422);
  });

  test("should return 401 without valid authorization", async () => {
    const groupRequest: LeaveGroupRequest = {
      username: "testuser",
    };

    const response = await request(server)
      .post(ApiEndpoint.LEAVE_GROUP)
      .send(groupRequest);
    expect(response.status).toEqual(401);
  });

  test("should leave group", async () => {
    await saveUser({ ...mockUser, groupCode: mockUser.serial });
    await saveUser({ ...mockUser2, groupCode: mockUser.serial });

    const groupRequest: LeaveGroupRequest = {
      username: mockUser2.username,
    };

    const response = await request(server)
      .post(ApiEndpoint.LEAVE_GROUP)
      .send(groupRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`
      );

    expect(response.status).toEqual(200);
    const updatedUser = await findUser(mockUser2.username);
    expect(updatedUser?.groupCode).toEqual("0");
  });
});

describe(`POST ${ApiEndpoint.CLOSE_GROUP}`, () => {
  test("should return 422 without valid body", async () => {
    const response = await request(server).post(ApiEndpoint.CLOSE_GROUP);
    expect(response.status).toEqual(422);
  });

  test("should return 401 without valid authorization", async () => {
    const groupRequest: CloseGroupRequest = {
      groupCode: "1234",
      username: "testuser",
    };

    const response = await request(server)
      .post(ApiEndpoint.CLOSE_GROUP)
      .send(groupRequest);
    expect(response.status).toEqual(401);
  });

  test("should close group and remove all group members", async () => {
    await saveUser({ ...mockUser, groupCode: mockUser.serial });
    await saveUser({ ...mockUser2, groupCode: mockUser.serial });

    const groupRequest: CloseGroupRequest = {
      groupCode: mockUser.serial,
      username: mockUser.username,
    };

    const response = await request(server)
      .post(ApiEndpoint.CLOSE_GROUP)
      .send(groupRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
      );

    expect(response.status).toEqual(200);
    const updatedUser = await findUser(mockUser2.username);
    expect(updatedUser?.groupCode).toEqual("0");
    const updatedUser2 = await findUser(mockUser2.username);
    expect(updatedUser2?.groupCode).toEqual("0");
  });
});

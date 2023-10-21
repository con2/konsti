import { Server } from "http";
import {
  expect,
  test,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
} from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostCloseGroupRequest,
  PostJoinGroupRequest,
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
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";

let server: Server;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  server = await startServer({
    dbConnString: mongoServer.getUri(),
    dbName: faker.string.alphanumeric(10),
    enableSentry: false,
  });
});

afterEach(async () => {
  await closeServer(server);
});

afterAll(async () => {
  await mongoServer.stop();
});

describe(`GET ${ApiEndpoint.GROUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).get(ApiEndpoint.GROUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 without valid body", async () => {
    const response = await request(server)
      .get(ApiEndpoint.GROUP)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`,
      );
    expect(response.status).toEqual(422);
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
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`,
      );

    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("success");
    expect(response.body.results.length).toEqual(2);
  });
});

describe(`POST ${ApiEndpoint.GROUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.GROUP);
    expect(response.status).toEqual(401);
  });

  test("should create group", async () => {
    const userResult = await saveUser(mockUser);
    const user = unsafelyUnwrapResult(userResult);
    expect(user.groupCode).toEqual("0");

    const response = await request(server)
      .post(ApiEndpoint.GROUP)
      .send({})
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);
    const updatedUserResult = await findUser(mockUser.username);
    const updatedUser = unsafelyUnwrapResult(updatedUserResult);
    expect(updatedUser?.groupCode).toEqual(updatedUser?.groupCreatorCode);

    const groupCodeMatcher = RegExp(
      "^[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}$",
    );
    expect(groupCodeMatcher.test(updatedUser?.groupCode ?? "")).toBeTruthy();
  });
});

describe(`POST ${ApiEndpoint.JOIN_GROUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.JOIN_GROUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 without valid body", async () => {
    const response = await request(server)
      .post(ApiEndpoint.JOIN_GROUP)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`,
      );
    expect(response.status).toEqual(422);
  });

  test("should join group", async () => {
    const groupCode = "123-234-345";

    await saveGames([testGame, testGame2]);
    await saveUser({ ...mockUser, groupCode, groupCreatorCode: groupCode });
    await saveUser(mockUser2);
    const userWithSignupsResult = await saveSignedGames({
      signedGames: mockSignedGames,
      username: mockUser2.username,
    });
    const userWithSignups = unsafelyUnwrapResult(userWithSignupsResult);
    expect(userWithSignups.signedGames.length).toEqual(2);

    const groupRequest: PostJoinGroupRequest = {
      groupCode,
    };

    const response = await request(server)
      .post(ApiEndpoint.JOIN_GROUP)
      .send(groupRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`,
      );

    expect(response.status).toEqual(200);
    const updatedUserResult = await findUser(mockUser2.username);
    const updatedUser = unsafelyUnwrapResult(updatedUserResult);
    expect(updatedUser?.groupCode).toEqual(groupCode);
    expect(updatedUser?.signedGames.length).toEqual(0);
  });

  test("should return error if existing upcoming signups", async () => {
    await saveTestSettings({
      testTime: dayjs(testGame.startTime).subtract(2, "hours").toISOString(),
    });

    await saveGames([testGame]);
    await saveUser({ ...mockUser, groupCode: mockUser.serial });
    await saveUser(mockUser2);
    await saveSignup({
      ...mockPostEnteredGameRequest,
      username: mockUser2.username,
    });

    const groupRequest: PostJoinGroupRequest = {
      groupCode: mockUser.serial,
    };

    const response = await request(server)
      .post(ApiEndpoint.JOIN_GROUP)
      .send(groupRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`,
      );

    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("error");
    expect(response.body.message).toEqual("Signup in future");
  });
});

describe(`POST ${ApiEndpoint.LEAVE_GROUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.LEAVE_GROUP);
    expect(response.status).toEqual(401);
  });

  test("should leave group", async () => {
    await saveUser({ ...mockUser, groupCode: mockUser.serial });
    await saveUser({ ...mockUser2, groupCode: mockUser.serial });

    const response = await request(server)
      .post(ApiEndpoint.LEAVE_GROUP)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`,
      );

    expect(response.status).toEqual(200);
    const updatedUserResult = await findUser(mockUser2.username);
    const updatedUser = unsafelyUnwrapResult(updatedUserResult);
    expect(updatedUser?.groupCode).toEqual("0");
  });
});

describe(`POST ${ApiEndpoint.CLOSE_GROUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.CLOSE_GROUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 without valid body", async () => {
    const response = await request(server)
      .post(ApiEndpoint.CLOSE_GROUP)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(422);
  });

  test("should close group and remove all group members", async () => {
    const groupCode = "abc-dfg-hij";

    await saveUser({ ...mockUser, groupCode, groupCreatorCode: groupCode });
    await saveUser({ ...mockUser2, groupCode });

    const groupRequest: PostCloseGroupRequest = {
      groupCode,
    };

    const response = await request(server)
      .post(ApiEndpoint.CLOSE_GROUP)
      .send(groupRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);
    const updatedUserResult = await findUser(mockUser2.username);
    const updatedUser = unsafelyUnwrapResult(updatedUserResult);
    expect(updatedUser?.groupCode).toEqual("0");
    const updatedUserResult2 = await findUser(mockUser2.username);
    const updatedUser2 = unsafelyUnwrapResult(updatedUserResult2);
    expect(updatedUser2?.groupCode).toEqual("0");
  });
});

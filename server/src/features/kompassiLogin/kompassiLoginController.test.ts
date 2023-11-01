import { Server } from "http";
import {
  expect,
  test,
  afterAll,
  afterEach,
  beforeAll,
  describe,
  beforeEach,
} from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { closeServer, startServer } from "server/utils/server";
import { UserGroup } from "shared/typings/models/user";
import { getJWT } from "server/utils/jwt";
import { PostVerifyKompassiLoginRequest } from "shared/typings/api/login";
import { findUser, saveUser } from "server/features/user/userRepository";
import { mockUser, mockUser2 } from "server/test/mock-data/mockUser";
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

describe(`POST ${ApiEndpoint.VERIFY_KOMPASSI_LOGIN}`, () => {
  test("should return 401 without authorization", async () => {
    const response = await request(server).post(
      ApiEndpoint.VERIFY_KOMPASSI_LOGIN,
    );
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid body", async () => {
    const response = await request(server)
      .post(ApiEndpoint.VERIFY_KOMPASSI_LOGIN)
      .send({})
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(422);
  });

  test("should return 200 with valid authorization and body", async () => {
    const requestBody: PostVerifyKompassiLoginRequest = {
      username: "new_username",
    };
    const response = await request(server)
      .post(ApiEndpoint.VERIFY_KOMPASSI_LOGIN)
      .send(requestBody)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(200);
  });

  test("should update old username with new username", async () => {
    await saveUser({ ...mockUser, kompassiId: 10 });

    const requestBody: PostVerifyKompassiLoginRequest = {
      username: "new_username",
    };

    const response = await request(server)
      .post(ApiEndpoint.VERIFY_KOMPASSI_LOGIN)
      .send(requestBody)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("success");

    const userResult = await findUser("new_username");
    const user = unsafelyUnwrapResult(userResult);
    expect(user?.kompassiId).toEqual(10);
    expect(user?.kompassiUsernameAccepted).toEqual(true);
  });

  test("should return error if username already taken", async () => {
    await saveUser({ ...mockUser, kompassiId: 10 });
    await saveUser(mockUser2);

    const requestBody: PostVerifyKompassiLoginRequest = {
      username: mockUser2.username,
    };

    const response = await request(server)
      .post(ApiEndpoint.VERIFY_KOMPASSI_LOGIN)
      .send(requestBody)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);
    expect(response.body.status).toEqual("error");
    expect(response.body.errorId).toEqual("usernameNotFree");
  });
});

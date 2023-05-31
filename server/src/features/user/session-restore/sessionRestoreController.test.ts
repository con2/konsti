import { Server } from "http";
import {
  expect,
  test,
  afterAll,
  beforeAll,
  describe,
  beforeEach,
  afterEach,
} from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { mockUser } from "server/test/mock-data/mockUser";
import { saveUser } from "server/features/user/userRepository";
import { closeServer, startServer } from "server/utils/server";
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

describe(`POST ${ApiEndpoint.SESSION_RESTORE}`, () => {
  test("should return 422 without any parameters", async () => {
    const response = await request(server).post(ApiEndpoint.SESSION_RESTORE);
    expect(response.status).toEqual(422);
  });

  test("should return 200 and error message with invalid jwt parameter", async () => {
    const response = await request(server)
      .post(ApiEndpoint.SESSION_RESTORE)
      .send({ jwt: "testjwt" });
    expect(response.status).toEqual(200);
    expect(response.body.message).toEqual("Invalid jwt");
  });

  test("should return 200 and success with valid jwt parameter", async () => {
    const userAsyncResult = await saveUser(mockUser);
    const user = unsafelyUnwrapResult(userAsyncResult);
    expect(user.password).toEqual(mockUser.passwordHash);

    const loginResponse = await request(server)
      .post(ApiEndpoint.LOGIN)
      .send({ username: mockUser.username, password: "password" });

    expect(loginResponse.status).toEqual(200);
    expect(loginResponse.body.message).toEqual("User login success");

    const sessionRestoreResponse = await request(server)
      .post(ApiEndpoint.SESSION_RESTORE)
      .send({ jwt: loginResponse.body.jwt });

    expect(sessionRestoreResponse.status).toEqual(200);
    expect(sessionRestoreResponse.body.message).toEqual(
      "Session restore success"
    );
  });
});

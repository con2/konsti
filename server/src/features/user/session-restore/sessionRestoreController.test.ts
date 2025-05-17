import { Server } from "node:http";
import { expect, test, describe, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { mockUser } from "server/test/mock-data/mockUser";
import { saveUser } from "server/features/user/userRepository";
import { closeServer, startServer } from "server/utils/server";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { PostLoginError, PostLoginResponse } from "shared/types/api/login";

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

    const body = response.body as PostLoginError;
    expect(body.message).toEqual("Invalid jwt");
  });

  test("should return 200 and success with valid jwt parameter", async () => {
    const user = unsafelyUnwrap(await saveUser(mockUser));
    expect(user.password).toEqual(mockUser.passwordHash);

    const loginResponse = await request(server)
      .post(ApiEndpoint.LOGIN)
      .send({ username: mockUser.username, password: "password" });

    expect(loginResponse.status).toEqual(200);

    const loginBody = loginResponse.body as PostLoginResponse;
    expect(loginBody.message).toEqual("User login success");

    const sessionRestoreResponse = await request(server)
      .post(ApiEndpoint.SESSION_RESTORE)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      .send({ jwt: loginResponse.body.jwt });

    expect(sessionRestoreResponse.status).toEqual(200);

    const sessionRestoreBody = sessionRestoreResponse.body as PostLoginResponse;
    expect(sessionRestoreBody.message).toEqual("Session restore success");
  });
});

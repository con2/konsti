import { Server } from "node:http";
import { expect, test, describe, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { mockUser } from "server/test/mock-data/mockUser";
import { removeUsers, saveUser } from "server/features/user/userRepository";
import { closeServer, startServer } from "server/utils/server";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import {
  PostLoginResult,
  PostSessionRecoveryError,
} from "shared/types/api/login";

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

    const body = response.body as PostSessionRecoveryError;
    expect(body.message).toEqual("Invalid jwt");
    // Definitive, so the client discards the session instead of retrying it
    expect(body.errorId).toEqual("sessionExpired");
  });

  test("should report a jwt signed with another key as expired", async () => {
    // Decodes cleanly but the signature doesn't verify, which is what a
    // rotated secret leaves in a browser
    const foreignJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IlRlc3QgVXNlciIsInVzZXJHcm91cCI6InVzZXIifQ.not-a-valid-signature";

    const response = await request(server)
      .post(ApiEndpoint.SESSION_RESTORE)
      .send({ jwt: foreignJwt });
    expect(response.status).toEqual(200);

    const body = response.body as PostSessionRecoveryError;
    expect(body.errorId).toEqual("sessionExpired");
  });

  test("should report a jwt for a user that no longer exists as a failed login", async () => {
    await saveUser(mockUser);
    const loginResponse = await request(server)
      .post(ApiEndpoint.LOGIN)
      .send({ username: mockUser.username, password: "password" });
    const { jwt } = loginResponse.body as PostLoginResult;

    // The database is wiped between deploys, so a token can outlive its user
    await removeUsers();

    const response = await request(server)
      .post(ApiEndpoint.SESSION_RESTORE)
      .send({ jwt });
    expect(response.status).toEqual(200);

    const body = response.body as PostSessionRecoveryError;
    expect(body.errorId).toEqual("loginFailed");
  });

  test("should return 200 and success with valid jwt parameter", async () => {
    const user = unsafelyUnwrap(await saveUser(mockUser));
    expect(user.password).toEqual(mockUser.passwordHash);

    const loginResponse = await request(server)
      .post(ApiEndpoint.LOGIN)
      .send({ username: mockUser.username, password: "password" });

    expect(loginResponse.status).toEqual(200);

    const loginBody = loginResponse.body as PostLoginResult;
    expect(loginBody.message).toEqual("User login success");

    const sessionRestoreResponse = await request(server)
      .post(ApiEndpoint.SESSION_RESTORE)
      .send({ jwt: loginBody.jwt });

    expect(sessionRestoreResponse.status).toEqual(200);

    const sessionRestoreBody = sessionRestoreResponse.body as PostLoginResult;
    expect(sessionRestoreBody.message).toEqual("Session restore success");
  });
});

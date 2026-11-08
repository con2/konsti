import { randomUUID } from "node:crypto";
import { Server } from "node:http";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostLoginResult,
  PostSessionRecoveryError,
} from "shared/types/api/login";
import {
  removeUsers,
  saveUser,
  updateUserKompassiLoginStatus,
} from "server/features/user/userRepository";
import { mockUser } from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { getJWT } from "server/utils/jwt";
import { closeServer, startServer } from "server/utils/server";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: randomUUID(),
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

  test("should restore the renamed user from a token issued before the rename", async () => {
    const user = unsafelyUnwrap(
      await saveUser({ ...mockUser, kompassiId: "10" }),
    );
    const jwt = getJWT(user.userGroup, user);
    await updateUserKompassiLoginStatus(user.userId, "new_username");

    const response = await request(server)
      .post(ApiEndpoint.SESSION_RESTORE)
      .send({ jwt });

    const body = response.body as PostLoginResult;
    expect(body.username).toEqual("new_username");
    expect(body.userId).toEqual(user.userId);
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

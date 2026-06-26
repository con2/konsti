import { Server } from "node:http";
import { expect, test, afterEach, describe, beforeEach } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { ApiEndpoint, AuthEndpoint } from "shared/constants/apiEndpoints";
import { closeServer, startServer } from "server/utils/server";
import { UserGroup } from "shared/types/models/user";
import { getJWT } from "server/utils/jwt";
import {
  PostVerifyKompassiLoginError,
  PostVerifyKompassiLoginRequest,
  PostVerifyKompassiLoginResult,
} from "shared/types/api/login";
import { findUser, saveUser } from "server/features/user/userRepository";
import { mockUser, mockUser2 } from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

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
    const body = response.body as PostVerifyKompassiLoginResult;
    expect(body.status).toEqual("success");

    const user = unsafelyUnwrap(await findUser("new_username"));
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

    const body = response.body as PostVerifyKompassiLoginError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("usernameNotFree");
  });

  test("should not check for existing username if username not changed", async () => {
    await saveUser({ ...mockUser, kompassiId: 10 });

    const requestBody: PostVerifyKompassiLoginRequest = {
      username: mockUser.username,
    };

    const response = await request(server)
      .post(ApiEndpoint.VERIFY_KOMPASSI_LOGIN)
      .send(requestBody)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);
    const body = response.body as PostVerifyKompassiLoginResult;
    expect(body.status).toEqual("success");

    const user = unsafelyUnwrap(await findUser(mockUser.username));
    expect(user?.kompassiId).toEqual(10);
    expect(user?.kompassiUsernameAccepted).toEqual(true);
  });
});

describe(`POST ${AuthEndpoint.KOMPASSI_LOGIN}`, () => {
  test("should return 422 without origin header", async () => {
    const response = await request(server).post(AuthEndpoint.KOMPASSI_LOGIN);
    expect(response.status).toEqual(422);
  });

  test("should return 302 with the authorize redirect location", async () => {
    const response = await request(server)
      .post(AuthEndpoint.KOMPASSI_LOGIN)
      .set("Origin", "http://localhost:8000");

    expect(response.status).toEqual(302);
    const body = response.body as { location: string };
    expect(body.location).toContain("/oauth2/authorize");
    expect(body.location).toContain("response_type=code");
  });
});

describe(`POST ${AuthEndpoint.KOMPASSI_LOGIN_CALLBACK}`, () => {
  test("should return 422 with invalid body", async () => {
    const response = await request(server)
      .post(AuthEndpoint.KOMPASSI_LOGIN_CALLBACK)
      .set("Origin", "http://localhost:8000")
      .send({});
    expect(response.status).toEqual(422);
  });

  test("should return 422 without origin header", async () => {
    const response = await request(server)
      .post(AuthEndpoint.KOMPASSI_LOGIN_CALLBACK)
      .send({ code: "test-code" });
    expect(response.status).toEqual(422);
  });
});

describe(`POST ${AuthEndpoint.KOMPASSI_LOGOUT}`, () => {
  test("should return 422 without origin header", async () => {
    const response = await request(server).post(AuthEndpoint.KOMPASSI_LOGOUT);
    expect(response.status).toEqual(422);
  });

  test("should return 302 with the logout redirect location", async () => {
    const response = await request(server)
      .post(AuthEndpoint.KOMPASSI_LOGOUT)
      .set("Origin", "http://localhost:8000");

    expect(response.status).toEqual(302);
    const body = response.body as { location: string };
    expect(body.location).toContain("/logout?next=");
    expect(body.location).toContain("kompassi-logout-callback");
  });
});

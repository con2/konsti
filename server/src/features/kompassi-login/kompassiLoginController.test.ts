import { Server } from "node:http";
import { expect, test, afterEach, describe, beforeEach, vi } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { ApiEndpoint, AuthEndpoint } from "shared/constants/apiEndpoints";
import { closeServer, startServer } from "server/utils/server";
import { UserGroup } from "shared/types/models/user";
import { getJWT } from "server/utils/jwt";
import {
  PostKompassiLoginResponse,
  PostVerifyKompassiLoginError,
  PostVerifyKompassiLoginRequest,
  PostVerifyKompassiLoginResult,
} from "shared/types/api/login";
import {
  findUser,
  findUserByKompassiId,
  saveUser,
} from "server/features/user/userRepository";
import { mockUser, mockUser2 } from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import {
  KompassiProfile,
  KompassiTokens,
} from "server/features/kompassi-login/KompassiLoginTypes";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  vi.restoreAllMocks();
  await closeServer(server);
});

const mockKompassiTokens: KompassiTokens = {
  access_token: "test-access-token",
  expires_in: 3600,
  token_type: "Bearer",
  scope: "read",
  refresh_token: "test-refresh-token",
};

const mockKompassiProfile: KompassiProfile = {
  id: 42,
  first_name: "Test",
  surname: "Person",
  nick: "tester",
  full_name: "Test Person",
  display_name: "Test Person",
  preferred_name_display_style: "firstname_surname",
  email: "kompassi-user@example.com",
  birth_date: null,
  phone: "",
  username: "kompassi_user",
  groups: ["users"],
};

const mockKompassiFetch = (profile: KompassiProfile): void => {
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = input instanceof Request ? input.url : input.toString();
    if (url.endsWith("/oauth2/token")) {
      return Promise.resolve(Response.json(mockKompassiTokens));
    }
    if (url.endsWith("/api/v2/people/me")) {
      return Promise.resolve(Response.json(profile));
    }
    return Promise.reject(new Error(`Unexpected fetch to ${url}`));
  });
};

const postKompassiLoginCallback = async (
  s: Server,
): Promise<request.Response> => {
  return request(s)
    .post(AuthEndpoint.KOMPASSI_LOGIN_CALLBACK)
    .set("Origin", "http://localhost:8000")
    .send({ code: "test-code" });
};

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

  test("should create new user and log in on first Kompassi login", async () => {
    mockKompassiFetch(mockKompassiProfile);

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({
      status: "success",
      username: mockKompassiProfile.username,
      userGroup: UserGroup.USER,
      kompassiUsernameAccepted: false,
      kompassiId: mockKompassiProfile.id,
      email: mockKompassiProfile.email,
    });
    expect((body as { jwt: string }).jwt).not.toEqual("");

    const user = unsafelyUnwrap(
      await findUserByKompassiId(mockKompassiProfile.id),
    );
    expect(user?.username).toEqual(mockKompassiProfile.username);
    expect(user?.serial).not.toEqual("");
  });

  test("should log in existing user with matching kompassiId", async () => {
    await saveUser({ ...mockUser, kompassiId: mockKompassiProfile.id });
    mockKompassiFetch(mockKompassiProfile);

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({
      status: "success",
      username: mockUser.username,
      serial: mockUser.serial,
      kompassiId: mockKompassiProfile.id,
    });
  });

  test("should append kompassiId to username if username is already taken", async () => {
    await saveUser({ ...mockUser, username: mockKompassiProfile.username });
    mockKompassiFetch(mockKompassiProfile);

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({
      status: "success",
      username: `${mockKompassiProfile.username}-${mockKompassiProfile.id}`,
    });
  });

  test("should not log in user without accepted access group", async () => {
    mockKompassiFetch({ ...mockKompassiProfile, groups: ["some-other-group"] });

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({
      status: "error",
      errorId: "invalidUserGroup",
    });

    const user = unsafelyUnwrap(
      await findUserByKompassiId(mockKompassiProfile.id),
    );
    expect(user).toEqual(null);
  });

  test("should return error when Kompassi token request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("Connection refused"),
    );

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({ status: "error", errorId: "unknown" });
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

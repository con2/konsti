import { randomUUID } from "node:crypto";
import { Server } from "node:http";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiEndpoint, AuthEndpoint } from "shared/constants/apiEndpoints";
import {
  PostKompassiLoginResponse,
  PostVerifyKompassiLoginError,
  PostVerifyKompassiLoginRequest,
  PostVerifyKompassiLoginResult,
} from "shared/types/api/login";
import { UserGroup } from "shared/types/models/user";
import { makeSuccessResult } from "shared/utils/result";
import {
  KompassiTokens,
  KompassiUserinfo,
} from "server/features/kompassi-login/KompassiLoginTypes";
// eslint-disable-next-line import-x/no-namespace -- Spying on a module export needs the namespace object
import * as userRepository from "server/features/user/userRepository";
import {
  findUser,
  findUserByKompassiId,
  saveUser,
} from "server/features/user/userRepository";
import { mockUser, mockUser2 } from "server/test/mock-data/mockUser";
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
  vi.restoreAllMocks();
  await closeServer(server);
});

const mockKompassiTokens: KompassiTokens = {
  access_token: "test-access-token",
  expires_in: 3600,
  token_type: "Bearer",
  scope: "openid profile email",
  refresh_token: "test-refresh-token",
  id_token: "test-id-token",
};

const mockKompassiUserinfo: KompassiUserinfo = {
  sub: "42",
  email: "kompassi-user@example.com",
  name: 'Test "Tester" Person',
  given_name: "Test",
  family_name: "Person",
  groups: ["users"],
};

// The nick quoted in the name claim, which is what the username is derived from
const derivedUsername = "Tester";

const mockKompassiFetch = (userinfo: KompassiUserinfo): void => {
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = input instanceof Request ? input.url : input.toString();
    if (url.endsWith("/oidc/token/")) {
      return Promise.resolve(Response.json(mockKompassiTokens));
    }
    if (url.endsWith("/oidc/userinfo/")) {
      return Promise.resolve(Response.json(userinfo));
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

  test("should return loginFailed error if user of the session does not exist", async () => {
    const requestBody: PostVerifyKompassiLoginRequest = {
      username: "new_username",
    };
    const response = await request(server)
      .post(ApiEndpoint.VERIFY_KOMPASSI_LOGIN)
      .send(requestBody)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, "user-removed-from-db")}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostVerifyKompassiLoginError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("loginFailed");
  });

  test("should update old username with new username", async () => {
    await saveUser({ ...mockUser, kompassiId: "10" });

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
    expect(user?.kompassiId).toEqual("10");
    expect(user?.kompassiUsernameAccepted).toEqual(true);
  });

  test("should return error if username already taken", async () => {
    await saveUser({ ...mockUser, kompassiId: "10" });
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
    await saveUser({ ...mockUser, kompassiId: "10" });

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
    expect(user?.kompassiId).toEqual("10");
    expect(user?.kompassiUsernameAccepted).toEqual(true);
  });
});

describe(`POST ${AuthEndpoint.KOMPASSI_LOGIN}`, () => {
  test("should return 422 without origin header", async () => {
    const response = await request(server)
      .post(AuthEndpoint.KOMPASSI_LOGIN)
      .send({ state: "test-state" });
    expect(response.status).toEqual(422);
  });

  test("should return 422 without state", async () => {
    const response = await request(server)
      .post(AuthEndpoint.KOMPASSI_LOGIN)
      .set("Origin", "http://localhost:8000")
      .send({});
    expect(response.status).toEqual(422);
  });

  test("should return 302 with the authorize redirect location", async () => {
    const response = await request(server)
      .post(AuthEndpoint.KOMPASSI_LOGIN)
      .set("Origin", "http://localhost:8000")
      .send({ state: "test-state" });

    expect(response.status).toEqual(302);
    const body = response.body as { location: string };
    expect(body.location).toContain("/oidc/authorize/");
    expect(body.location).toContain("response_type=code");
    expect(body.location).toContain("scope=openid+profile+email");
    expect(body.location).toContain("state=test-state");
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
    mockKompassiFetch(mockKompassiUserinfo);

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({
      status: "success",
      username: derivedUsername,
      userGroup: UserGroup.USER,
      kompassiUsernameAccepted: false,
      kompassiId: mockKompassiUserinfo.sub,
      email: mockKompassiUserinfo.email,
    });
    expect((body as { jwt: string }).jwt).not.toEqual("");

    const user = unsafelyUnwrap(
      await findUserByKompassiId(mockKompassiUserinfo.sub),
    );
    expect(user?.username).toEqual(derivedUsername);
    expect(user?.serial).not.toEqual("");
  });

  test("should fall back to given name when the name claim has no nick", async () => {
    mockKompassiFetch({ ...mockKompassiUserinfo, name: "Test Person" });

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({
      status: "success",
      username: mockKompassiUserinfo.given_name,
    });
  });

  test("should log in existing user with matching kompassiId", async () => {
    await saveUser({ ...mockUser, kompassiId: mockKompassiUserinfo.sub });
    mockKompassiFetch(mockKompassiUserinfo);

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({
      status: "success",
      username: mockUser.username,
      serial: mockUser.serial,
      kompassiId: mockKompassiUserinfo.sub,
    });
  });

  test("should append the Kompassi id to username if username is already taken", async () => {
    await saveUser({ ...mockUser, username: derivedUsername });
    mockKompassiFetch(mockKompassiUserinfo);

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({
      status: "success",
      username: `${derivedUsername}-${mockKompassiUserinfo.sub}`,
    });
  });

  // An empty username saves fine but its JWT fails every authenticated
  // request, so the account would be unusable and unrecoverable
  test("should never derive an empty username", async () => {
    mockKompassiFetch({
      ...mockKompassiUserinfo,
      name: "",
      given_name: "",
      email: "",
    });

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({
      status: "success",
      username: `kompassi-${mockKompassiUserinfo.sub}`,
    });
  });

  // Two logins deriving the same nick race between the free-username check and
  // the save. saveUser stores the row before validating it, so retrying after
  // anything but a rejected unique index would create a second account
  test("should retry with a unique username when the name is taken between the check and the save", async () => {
    mockKompassiFetch(mockKompassiUserinfo);
    // The username is free at check time and taken by the time we save
    vi.spyOn(userRepository, "findUser").mockResolvedValueOnce(
      makeSuccessResult(null),
    );
    await saveUser({ ...mockUser, username: derivedUsername });

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({
      status: "success",
      username: `${derivedUsername}-${mockKompassiUserinfo.sub}`,
    });

    const users = unsafelyUnwrap(await userRepository.findUsers());
    expect(
      users.filter((user) => user.kompassiId === mockKompassiUserinfo.sub),
    ).toHaveLength(1);
  });

  // Kompassi accepts addresses Konsti's stored-email format rejects, and that
  // format is checked on read - storing one would make the account unreadable,
  // so the user could never log in again
  test("should store no email when Kompassi's address is one Konsti cannot store", async () => {
    // Konsti's email format is ASCII only, so a non-ASCII address is accepted
    // by Kompassi and rejected here
    mockKompassiFetch({
      ...mockKompassiUserinfo,
      email: "käyttäjä@example.com",
    });

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({ status: "success", email: "" });

    // Readable back out, which is the whole point
    const user = unsafelyUnwrap(
      await findUserByKompassiId(mockKompassiUserinfo.sub),
    );
    expect(user?.email).toEqual("");
  });

  test("should not log in when the sub claim is empty", async () => {
    mockKompassiFetch({ ...mockKompassiUserinfo, sub: "" });

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({ status: "error", errorId: "unknown" });
  });

  test("should not log in user without accepted access group", async () => {
    mockKompassiFetch({
      ...mockKompassiUserinfo,
      groups: ["some-other-group"],
    });

    const response = await postKompassiLoginCallback(server);
    expect(response.status).toEqual(200);

    const body = response.body as PostKompassiLoginResponse;
    expect(body).toMatchObject({
      status: "error",
      errorId: "invalidUserGroup",
    });

    const user = unsafelyUnwrap(
      await findUserByKompassiId(mockKompassiUserinfo.sub),
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

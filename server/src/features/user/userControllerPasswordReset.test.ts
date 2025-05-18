import { Server } from "node:http";
import { expect, test, afterEach, describe, beforeEach } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { UserGroup } from "shared/types/models/user";
import { getJWT } from "server/utils/jwt";
import { saveUser } from "server/features/user/userRepository";
import { mockUser } from "server/test/mock-data/mockUser";
import { closeServer, startServer } from "server/utils/server";
import {
  PostUpdateUserPasswordError,
  PostUpdateUserPasswordRequest,
  PostUpdateUserPasswordResponse,
} from "shared/types/api/users";

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

describe(`POST ${ApiEndpoint.USERS_PASSWORD}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.USERS_PASSWORD);
    expect(response.status).toEqual(401);
  });

  test("should return 422 without valid body", async () => {
    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send({
        username: "testuser",
      })
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(422);
  });

  test("should allow user to change own password", async () => {
    await saveUser(mockUser);

    const requestData: PostUpdateUserPasswordRequest = {
      usernameToUpdate: mockUser.username,
      password: "testpass",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(requestData)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);
    const body = response.body as PostUpdateUserPasswordResponse;
    expect(body.status).toEqual("success");
  });

  test("should not allow user to change other user's password", async () => {
    const requestData: PostUpdateUserPasswordRequest = {
      usernameToUpdate: "another_user",
      password: "testpass",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(requestData)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(401);
  });

  test("should allow helper to change other user's password", async () => {
    await saveUser(mockUser);

    const requestData: PostUpdateUserPasswordRequest = {
      usernameToUpdate: mockUser.username,
      password: "testpass",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(requestData)
      .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
    expect(response.status).toEqual(200);
    const body = response.body as PostUpdateUserPasswordResponse;
    expect(body.status).toEqual("success");
  });

  test("should not allow helper to change password for 'admin' or 'helper' users", async () => {
    const adminRequestData: PostUpdateUserPasswordRequest = {
      usernameToUpdate: "admin",
      password: "testpass",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(adminRequestData)
      .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
    expect(response.status).toEqual(200);

    const body = response.body as PostUpdateUserPasswordError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("notAllowed");

    const helperRequestData: PostUpdateUserPasswordRequest = {
      usernameToUpdate: "helper",
      password: "testpass",
    };

    const response2 = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(helperRequestData)
      .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
    expect(response2.status).toEqual(200);

    const body2 = response2.body as PostUpdateUserPasswordError;
    expect(body2.status).toEqual("error");
    expect(body2.errorId).toEqual("notAllowed");
  });

  test("should allow admin to change password for 'admin' or 'helper' users", async () => {
    await saveUser({ ...mockUser, username: "admin" });
    await saveUser({ ...mockUser, username: "helper" });

    const adminRequestData: PostUpdateUserPasswordRequest = {
      usernameToUpdate: "admin",
      password: "testpass",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(adminRequestData)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const body = response.body as PostUpdateUserPasswordResponse;
    expect(body.status).toEqual("success");

    const helperRequestData: PostUpdateUserPasswordRequest = {
      usernameToUpdate: "helper",
      password: "testpass",
    };

    const response2 = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(helperRequestData)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response2.status).toEqual(200);

    const body2 = response2.body as PostUpdateUserPasswordResponse;
    expect(body2.status).toEqual("success");
  });

  test("should not allow Kompassi login user to change local password", async () => {
    await saveUser({ ...mockUser, kompassiId: 100 });

    const requestData: PostUpdateUserPasswordRequest = {
      usernameToUpdate: mockUser.username,
      password: "testpass",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(requestData)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostUpdateUserPasswordError;
    expect(body.status).toEqual("error");
  });
});

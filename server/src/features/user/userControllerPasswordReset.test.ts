import { randomUUID } from "node:crypto";
import { Server } from "node:http";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostUpdateUserPasswordError,
  PostUpdateUserPasswordRequest,
  PostUpdateUserPasswordResult,
} from "shared/types/api/users";
import { UserGroup } from "shared/types/models/user";
import { saveUser } from "server/features/user/userRepository";
import { mockUser } from "server/test/mock-data/mockUser";
import { authorizedAs } from "server/test/utils/authorizedAs";
import { getUserId } from "server/test/utils/getUserId";
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
      .set(await authorizedAs(UserGroup.USER, "testuser"));
    expect(response.status).toEqual(422);
  });

  test("should return 422 for an empty password", async () => {
    await saveUser(mockUser);

    const requestData: PostUpdateUserPasswordRequest = {
      userIdToUpdate: await getUserId(mockUser.username),
      password: "",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(requestData)
      .set(await authorizedAs(UserGroup.USER, mockUser.username));
    expect(response.status).toEqual(422);
  });

  test("should allow user to change own password", async () => {
    await saveUser(mockUser);

    const requestData: PostUpdateUserPasswordRequest = {
      userIdToUpdate: await getUserId(mockUser.username),
      password: "testpass",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(requestData)
      .set(await authorizedAs(UserGroup.USER, mockUser.username));
    expect(response.status).toEqual(200);
    const body = response.body as PostUpdateUserPasswordResult;
    expect(body.status).toEqual("success");
  });

  test("should not allow user to change other user's password", async () => {
    const requestData: PostUpdateUserPasswordRequest = {
      userIdToUpdate: "another-user-id",
      password: "testpass",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(requestData)
      .set(await authorizedAs(UserGroup.USER, "testuser"));
    expect(response.status).toEqual(401);
  });

  test("should not allow a regular user named 'admin' to change another user's password", async () => {
    await saveUser(mockUser);

    const requestData: PostUpdateUserPasswordRequest = {
      userIdToUpdate: await getUserId(mockUser.username),
      password: "testpass",
    };

    // Authorization must be by JWT userGroup, not by the username string - a USER-group
    // token whose username happens to be "admin" must not gain reset rights
    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(requestData)
      .set(await authorizedAs(UserGroup.USER, "admin"));
    expect(response.status).toEqual(401);
  });

  test("should allow a helper with any username to change other user's password", async () => {
    await saveUser(mockUser);

    const requestData: PostUpdateUserPasswordRequest = {
      userIdToUpdate: await getUserId(mockUser.username),
      password: "testpass",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(requestData)
      .set(await authorizedAs(UserGroup.HELPER, "desk-volunteer"));
    expect(response.status).toEqual(200);
    const body = response.body as PostUpdateUserPasswordResult;
    expect(body.status).toEqual("success");
  });

  test("should allow helper to change other user's password", async () => {
    await saveUser(mockUser);

    const requestData: PostUpdateUserPasswordRequest = {
      userIdToUpdate: await getUserId(mockUser.username),
      password: "testpass",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(requestData)
      .set(await authorizedAs(UserGroup.HELPER, "helper"));
    expect(response.status).toEqual(200);
    const body = response.body as PostUpdateUserPasswordResult;
    expect(body.status).toEqual("success");
  });

  test("should not allow helper to change password for 'admin' or 'helper' users", async () => {
    await saveUser({ ...mockUser, username: "admin" });
    await saveUser({
      ...mockUser,
      username: "helper",
      serial: "helper-serial",
    });

    const adminRequestData: PostUpdateUserPasswordRequest = {
      userIdToUpdate: await getUserId("admin"),
      password: "testpass",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(adminRequestData)
      .set(await authorizedAs(UserGroup.HELPER, "helper"));
    expect(response.status).toEqual(200);

    const body = response.body as PostUpdateUserPasswordError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("notAllowed");

    const helperRequestData: PostUpdateUserPasswordRequest = {
      userIdToUpdate: await getUserId("helper"),
      password: "testpass",
    };

    const response2 = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(helperRequestData)
      .set(await authorizedAs(UserGroup.HELPER, "helper"));
    expect(response2.status).toEqual(200);

    const body2 = response2.body as PostUpdateUserPasswordError;
    expect(body2.status).toEqual("error");
    expect(body2.errorId).toEqual("notAllowed");
  });

  test("should allow admin to change password for 'admin' or 'helper' users", async () => {
    await saveUser({ ...mockUser, username: "admin" });
    await saveUser({
      ...mockUser,
      username: "helper",
      serial: "helper-serial",
    });

    const adminRequestData: PostUpdateUserPasswordRequest = {
      userIdToUpdate: await getUserId("admin"),
      password: "testpass",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(adminRequestData)
      .set(await authorizedAs(UserGroup.ADMIN, "admin"));
    expect(response.status).toEqual(200);

    const body = response.body as PostUpdateUserPasswordResult;
    expect(body.status).toEqual("success");

    const helperRequestData: PostUpdateUserPasswordRequest = {
      userIdToUpdate: await getUserId("helper"),
      password: "testpass",
    };

    const response2 = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(helperRequestData)
      .set(await authorizedAs(UserGroup.ADMIN, "admin"));
    expect(response2.status).toEqual(200);

    const body2 = response2.body as PostUpdateUserPasswordResult;
    expect(body2.status).toEqual("success");
  });

  test("should not allow Kompassi login user to change local password", async () => {
    await saveUser({ ...mockUser, kompassiId: "100" });

    const requestData: PostUpdateUserPasswordRequest = {
      userIdToUpdate: await getUserId(mockUser.username),
      password: "testpass",
    };

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send(requestData)
      .set(await authorizedAs(UserGroup.USER, mockUser.username));
    expect(response.status).toEqual(200);

    const body = response.body as PostUpdateUserPasswordError;
    expect(body.status).toEqual("error");
  });
});

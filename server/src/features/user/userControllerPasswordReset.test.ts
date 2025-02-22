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

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send({
        userToUpdateUsername: mockUser.username,
        password: "testpass",
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("success");
  });

  test("should not allow user to change other user's password", async () => {
    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send({
        userToUpdateUsername: "another_user",
        password: "testpass",
      })
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(401);
  });

  test("should allow helper to change other user's password", async () => {
    await saveUser(mockUser);

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send({
        userToUpdateUsername: mockUser.username,
        password: "testpass",
      })
      .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
    expect(response.status).toEqual(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("success");
  });

  test("should not allow helper to change password for 'admin' or 'helper' users", async () => {
    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send({
        userToUpdateUsername: "admin",
        password: "testpass",
      })
      .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
    expect(response.status).toEqual(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("error");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.errorId).toEqual("notAllowed");

    const response2 = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send({
        userToUpdateUsername: "helper",
        password: "testpass",
      })
      .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
    expect(response2.status).toEqual(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response2.body.status).toEqual("error");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response2.body.errorId).toEqual("notAllowed");
  });

  test("should allow admin to change password for 'admin' or 'helper' users", async () => {
    await saveUser({ ...mockUser, username: "admin" });
    await saveUser({ ...mockUser, username: "helper" });

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send({
        userToUpdateUsername: "admin",
        password: "testpass",
      })
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("success");

    const response2 = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send({
        userToUpdateUsername: "helper",
        password: "testpass",
      })
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response2.status).toEqual(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response2.body.status).toEqual("success");
  });

  test("should not allow Kompassi login user to change local password", async () => {
    await saveUser({ ...mockUser, kompassiId: 100 });

    const response = await request(server)
      .post(ApiEndpoint.USERS_PASSWORD)
      .send({
        userToUpdateUsername: mockUser.username,
        password: "testpass",
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("error");
  });
});

import { Server } from "node:http";
import { faker } from "@faker-js/faker";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostLoginResult } from "shared/types/api/login";
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

describe(`POST ${ApiEndpoint.LOGIN}`, () => {
  test("should return 422 without any parameters", async () => {
    const response = await request(server).post(ApiEndpoint.LOGIN);
    expect(response.status).toEqual(422);
  });

  test("should return 422 if username is found but password is missing", async () => {
    const response = await request(server).post(ApiEndpoint.LOGIN).send({
      username: "testuser",
    });
    expect(response.status).toEqual(422);
  });

  test("should return 422 if password is found but username is missing", async () => {
    const response = await request(server).post(ApiEndpoint.LOGIN).send({
      password: "testpass",
    });
    expect(response.status).toEqual(422);
  });

  test("should return 200 if password and username are found", async () => {
    const response = await request(server)
      .post(ApiEndpoint.LOGIN)
      .send({ username: "testuser", password: "testpass" });
    expect(response.status).toEqual(200);
  });

  test("should trim surrounding whitespace from the password, matching registration", async () => {
    // mockUser.passwordHash is the hash of "password"; registration trims on write, so login
    // must trim too or a user who typed a trailing space would be locked out
    await saveUser(mockUser);

    const response = await request(server)
      .post(ApiEndpoint.LOGIN)
      .send({ username: mockUser.username, password: "password " });
    expect(response.status).toEqual(200);

    const body = response.body as PostLoginResult;
    expect(body.status).toEqual("success");
  });
});

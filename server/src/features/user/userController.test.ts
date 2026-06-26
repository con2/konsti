import { Server } from "node:http";
import { expect, test, afterEach, describe, beforeEach } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { UserGroup } from "shared/types/models/user";
import { getJWT } from "server/utils/jwt";
import { closeServer, startServer } from "server/utils/server";
import { saveSerials } from "server/features/serial/serialRepository";
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

describe(`GET ${ApiEndpoint.USERS}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).get(ApiEndpoint.USERS);
    expect(response.status).toEqual(401);
  });
});

describe(`GET ${ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).get(
      ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME,
    );
    expect(response.status).toEqual(401);
  });

  test("should return 422 without valid body", async () => {
    const response = await request(server)
      .get(ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME)
      .set("Authorization", `Bearer ${getJWT(UserGroup.HELPER, "helper")}`);
    expect(response.status).toEqual(422);
  });
});

describe(`POST ${ApiEndpoint.USERS}`, () => {
  test("should return 422 without username", async () => {
    const response = await request(server).post(ApiEndpoint.USERS).send({
      password: "testpass",
      serial: "testserial",
    });
    expect(response.status).toEqual(422);
  });

  test("should return 422 without password", async () => {
    const response = await request(server).post(ApiEndpoint.USERS).send({
      username: "testuser",
      serial: "testserial",
    });
    expect(response.status).toEqual(422);
  });

  test("should return 422 without serial", async () => {
    const response = await request(server).post(ApiEndpoint.USERS).send({
      username: "testuser",
      password: "testpass",
    });
    expect(response.status).toEqual(422);
  });

  test("should return 200 with a valid serial", async () => {
    const serials = unsafelyUnwrap(await saveSerials(1));

    const response = await request(server).post(ApiEndpoint.USERS).send({
      username: "testuser",
      password: "testpass",
      serial: serials[0].serial,
    });
    expect(response.status).toEqual(200);
  });
});

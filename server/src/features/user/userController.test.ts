import { randomUUID } from "node:crypto";
import { Server } from "node:http";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostUserResponse } from "shared/types/api/users";
import { UserGroup } from "shared/types/models/user";
import { saveSerials } from "server/features/serial/serialRepository";
import { authorizedAs } from "server/test/utils/authorizedAs";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
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
      .set(await authorizedAs(UserGroup.HELPER, "helper"));
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

  test("should register only one of two simultaneous requests using one serial", async () => {
    const serials = unsafelyUnwrap(await saveSerials(1));

    const responses = await Promise.all(
      ["testuser1", "testuser2"].map(async (username) => {
        return request(server).post(ApiEndpoint.USERS).send({
          username,
          password: "testpass",
          serial: serials[0].serial,
        });
      }),
    );

    const bodies = responses.map((r) => r.body as PostUserResponse);
    expect(bodies.filter((b) => b.status === "success")).toHaveLength(1);
    expect(bodies.find((b) => b.status === "error")).toMatchObject({
      errorId: "invalidSerial",
    });
  });

  test("should register only one of two simultaneous requests using one username", async () => {
    const serials = unsafelyUnwrap(await saveSerials(2));

    const responses = await Promise.all(
      serials.map(async ({ serial }) => {
        return request(server).post(ApiEndpoint.USERS).send({
          username: "testuser",
          password: "testpass",
          serial,
        });
      }),
    );

    const bodies = responses.map((r) => r.body as PostUserResponse);
    expect(bodies.filter((b) => b.status === "success")).toHaveLength(1);
    expect(bodies.find((b) => b.status === "error")).toMatchObject({
      errorId: "usernameNotFree",
    });
  });
});

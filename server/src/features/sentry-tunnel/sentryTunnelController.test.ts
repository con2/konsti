import { Server } from "node:http";
import { expect, test, afterEach, beforeEach, describe, vi } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getJWT } from "server/utils/jwt";
import { UserGroup } from "shared/types/models/user";
import { mockUser } from "server/test/mock-data/mockUser";
import { logger } from "server/utils/logger";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  vi.resetAllMocks();
  await closeServer(server);
});

describe(`POST ${ApiEndpoint.SENTRY_TUNNEL}`, () => {
  test("should return 200 without errors with valid envelope data", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");

    const envelope = [
      JSON.stringify({
        event_id: "abc123",
        dsn: "https://public@sentry.io/6579203",
      }),
      JSON.stringify({
        type: "event",
      }),
      JSON.stringify({
        message: "Something went wrong!",
        level: "error",
        timestamp: new Date().toISOString(),
      }),
    ].join("\n");

    const response = await request(server)
      .post(ApiEndpoint.SENTRY_TUNNEL)
      .send(envelope)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);
    expect(errorLoggerSpy).not.toBeCalled();
  });

  test("should return 200 with errors with invalid envelope data", async () => {
    const errorLoggerSpy = vi.spyOn(logger, "error");
    const envelope = { foo: "bar" };

    const response = await request(server)
      .post(ApiEndpoint.SENTRY_TUNNEL)
      .send(envelope)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);
    expect(errorLoggerSpy).toBeCalled();
  });
});

describe(`GET ${ApiEndpoint.SENTRY_TEST}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).get(ApiEndpoint.SENTRY_TEST);
    expect(response.status).toEqual(401);
  });

  test("should return 401 with user authorization", async () => {
    const response = await request(server)
      .get(ApiEndpoint.SENTRY_TEST)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "username")}`);
    expect(response.status).toEqual(401);
  });

  test("should return 500 with admin authorization", async () => {
    const response = await request(server)
      .get(ApiEndpoint.SENTRY_TEST)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(500);
  });
});

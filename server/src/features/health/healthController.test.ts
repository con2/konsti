import { Server } from "node:http";
import { faker } from "@faker-js/faker";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
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

describe(`GET ${ApiEndpoint.HEALTH}`, () => {
  test("should return 200", async () => {
    const response = await request(server).get(ApiEndpoint.HEALTH);
    expect(response.status).toEqual(200);
  });
});

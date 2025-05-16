import { Server } from "node:http";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { expect, test, afterEach, beforeEach, describe } from "vitest";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

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
    const response = await request(server).get(ApiEndpoint.PROGRAM_ITEMS);
    expect(response.status).toEqual(200);
  });
});

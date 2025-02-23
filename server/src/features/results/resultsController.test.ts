import { Server } from "node:http";
import { expect, test, afterEach, beforeEach } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
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

test(`GET ${ApiEndpoint.RESULTS} should return 422 without any parameters`, async () => {
  const response = await request(server).get(ApiEndpoint.RESULTS);
  expect(response.status).toEqual(422);
});

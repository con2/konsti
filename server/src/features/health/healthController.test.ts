import { Server } from "http";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import {
  expect,
  test,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
} from "vitest";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

let server: Server;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  server = await startServer({
    dbConnString: mongoServer.getUri(),
    dbName: faker.string.alphanumeric(10),
    enableSentry: false,
  });
});

afterEach(async () => {
  await closeServer(server);
});

afterAll(async () => {
  await mongoServer.stop();
});

describe(`GET ${ApiEndpoint.HEALTH}`, () => {
  test(`should return 200`, async () => {
    const response = await request(server).get(ApiEndpoint.GAMES);
    expect(response.status).toEqual(200);
  });
});

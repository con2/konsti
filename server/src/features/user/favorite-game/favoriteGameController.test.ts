import { Server } from "http";
import {
  expect,
  test,
  afterAll,
  beforeAll,
  describe,
  beforeEach,
  afterEach,
} from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { UserGroup } from "shared/typings/models/user";
import { getJWT } from "server/utils/jwt";
import { closeServer, startServer } from "server/utils/server";

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

describe(`POST ${ApiEndpoint.FAVORITE}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.FAVORITE);
    expect(response.status).toEqual(401);
  });

  test("should return 422 without valid body", async () => {
    const response = await request(server)
      .post(ApiEndpoint.FAVORITE)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(422);
  });
});

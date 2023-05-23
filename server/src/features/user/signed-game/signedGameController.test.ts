import {
  expect,
  test,
  vi,
  afterAll,
  beforeAll,
  describe,
  afterEach,
} from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getJWT } from "server/utils/jwt";
import { UserGroup } from "shared/typings/models/user";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

afterEach(() => {
  vi.resetModules();
});

afterAll(async () => {
  await mongoServer.stop();
});

describe(`POST ${ApiEndpoint.SIGNED_GAME}`, () => {
  test("should return 401 without valid authorization", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).post(ApiEndpoint.SIGNED_GAME);
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 422 without valid body", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .post(ApiEndpoint.SIGNED_GAME)
        .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });
});

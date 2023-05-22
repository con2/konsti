import {
  expect,
  test,
  vi,
  afterAll,
  afterEach,
  beforeAll,
  describe,
} from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { PostFavoriteRequest } from "shared/typings/api/favorite";

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

describe(`POST ${ApiEndpoint.FAVORITE}`, () => {
  test("should return 422 without valid body", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).post(ApiEndpoint.FAVORITE);
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 401 without valid authorization", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    const saveFavoriteRequest: PostFavoriteRequest = {
      username: "testuser",
      favoritedGameIds: [],
    };

    try {
      const response = await request(server)
        .post(ApiEndpoint.FAVORITE)
        .send(saveFavoriteRequest);
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server);
    }
  });
});

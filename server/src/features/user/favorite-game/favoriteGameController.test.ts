import request from "supertest";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { SaveFavoriteRequest } from "shared/typings/api/favorite";

jest.mock("server/utils/logger");

afterEach(() => {
  jest.resetModules();
});

describe(`POST ${ApiEndpoint.FAVORITE}`, () => {
  test("should return 422 without valid body", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(ApiEndpoint.FAVORITE);
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 401 without valid authorization", async () => {
    const { server, mongoServer } = await startTestServer();

    const saveFavoriteRequest: SaveFavoriteRequest = {
      username: "testuser",
      favoritedGameIds: [],
    };

    try {
      const response = await request(server)
        .post(ApiEndpoint.FAVORITE)
        .send(saveFavoriteRequest);
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

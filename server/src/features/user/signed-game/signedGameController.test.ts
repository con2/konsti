import request from "supertest";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

jest.mock("server/utils/logger");

afterEach(() => {
  jest.resetModules();
});

describe(`POST ${ApiEndpoint.SIGNED_GAME}`, () => {
  test("should return 422 without valid body", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(ApiEndpoint.SIGNED_GAME);
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 401 without valid authorization", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server)
        .post(ApiEndpoint.SIGNED_GAME)
        .send({
          signupData: {
            username: "testuser",
            selectedGames: [],
            signupTime: "2019-11-23T08:00:00Z",
          },
        });
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

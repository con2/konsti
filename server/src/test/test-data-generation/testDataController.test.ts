import request from "supertest";
import { POPULATE_DB_ENDPOINT } from "shared/constants/apiEndpoints";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";

jest.mock("server/utils/logger");

afterEach(() => {
  jest.resetModules();
});

describe(`POST ${POPULATE_DB_ENDPOINT}`, () => {
  test("should return 404 on production", async () => {
    process.env.SETTINGS = "production";
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(POPULATE_DB_ENDPOINT);
      expect(response.status).toEqual(404);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

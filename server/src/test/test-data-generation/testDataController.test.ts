import { expect, test, vi, afterEach, describe } from "vitest";
import request from "supertest";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";

afterEach(() => {
  // Start server with different process.env.SETTINGS
  vi.resetModules();
});

describe(`POST ${ApiEndpoint.POPULATE_DB}`, () => {
  test("should return 404 on production", async () => {
    vi.stubEnv("SETTINGS", "production");
    const { server } = await startTestServer(globalThis.__MONGO_URI__);

    try {
      const response = await request(server).post(ApiEndpoint.POPULATE_DB);
      expect(response.status).toEqual(404);
    } finally {
      await stopTestServer(server);
    }
  });
});

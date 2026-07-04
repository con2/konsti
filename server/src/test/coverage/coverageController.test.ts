import { expect, test, vi, afterEach, describe } from "vitest";
import request from "supertest";
import { ApiDevEndpoint } from "shared/constants/apiEndpoints";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";

afterEach(() => {
  // Start server with different process.env.SETTINGS
  vi.resetModules();
});

describe(`POST ${ApiDevEndpoint.WRITE_COVERAGE}`, () => {
  test("should return 404 on production", async () => {
    vi.stubEnv("SETTINGS", "production");
    const { server } = await startTestServer(globalThis.__MONGO_URI__);

    try {
      const response = await request(server).post(
        ApiDevEndpoint.WRITE_COVERAGE,
      );
      expect(response.status).toEqual(404);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 404 on staging", async () => {
    vi.stubEnv("SETTINGS", "staging");
    const { server } = await startTestServer(globalThis.__MONGO_URI__);

    try {
      const response = await request(server).post(
        ApiDevEndpoint.WRITE_COVERAGE,
      );
      expect(response.status).toEqual(404);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 200 on development", async () => {
    vi.stubEnv("SETTINGS", "development");
    const { server } = await startTestServer(globalThis.__MONGO_URI__);

    try {
      const response = await request(server).post(
        ApiDevEndpoint.WRITE_COVERAGE,
      );
      expect(response.status).toEqual(200);
    } finally {
      await stopTestServer(server);
    }
  });
});

import { expect, test, vi, afterEach, describe } from "vitest";
import request from "supertest";
import { ApiDevEndpoint } from "shared/constants/apiEndpoints";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { TestSettings } from "shared/test-types/models/testSettings";

afterEach(() => {
  // Start server with different process.env.SETTINGS
  vi.resetModules();
});

describe(`GET ${ApiDevEndpoint.TEST_SETTINGS}`, () => {
  test("should return 404 on production", async () => {
    vi.stubEnv("SETTINGS", "production");
    const { server } = await startTestServer(globalThis.__MONGO_URI__);

    try {
      const response = await request(server).get(ApiDevEndpoint.TEST_SETTINGS);
      expect(response.status).toEqual(404);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return default settings", async () => {
    vi.stubEnv("SETTINGS", "development");
    const { server } = await startTestServer(globalThis.__MONGO_URI__);

    try {
      const response = await request(server).get(ApiDevEndpoint.TEST_SETTINGS);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        status: "success",
        message: "Getting test settings success",
        testSettings: { testTime: null },
      });
    } finally {
      await stopTestServer(server);
    }
  });
});

describe(`POST ${ApiDevEndpoint.TEST_SETTINGS}`, () => {
  test("should return 404 on production", async () => {
    vi.stubEnv("SETTINGS", "production");
    const { server } = await startTestServer(globalThis.__MONGO_URI__);

    try {
      const response = await request(server).post(ApiDevEndpoint.TEST_SETTINGS);
      expect(response.status).toEqual(404);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 422 with invalid body", async () => {
    vi.stubEnv("SETTINGS", "development");
    const { server } = await startTestServer(globalThis.__MONGO_URI__);

    try {
      const response = await request(server)
        .post(ApiDevEndpoint.TEST_SETTINGS)
        .send({ testTime: 12345 });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return updated test settings after update", async () => {
    vi.stubEnv("SETTINGS", "development");
    const { server } = await startTestServer(globalThis.__MONGO_URI__);

    try {
      const testSettings: TestSettings = {
        testTime: "2021-07-16T14:28:01.316Z",
      };

      const response = await request(server)
        .post(ApiDevEndpoint.TEST_SETTINGS)
        .send(testSettings);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        status: "success",
        message: "Update test settings success",
        testSettings,
      });
    } finally {
      await stopTestServer(server);
    }
  });
});

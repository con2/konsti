import { expect, test, vi, afterEach, describe } from "vitest";
import request from "supertest";
import { ApiDevEndpoint } from "shared/constants/apiEndpoints";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";

afterEach(() => {
  // Start server with different process.env.SETTINGS
  vi.resetModules();
});

describe(`POST ${ApiDevEndpoint.POPULATE_DB}`, () => {
  test("should return 404 on production", async () => {
    vi.stubEnv("SETTINGS", "production");
    const { server } = await startTestServer(globalThis.__MONGO_URI__);

    try {
      const response = await request(server).post(ApiDevEndpoint.POPULATE_DB);
      expect(response.status).toEqual(404);
    } finally {
      await stopTestServer(server);
    }
  });
});

describe(`POST ${ApiDevEndpoint.CLEAR_DB}`, () => {
  test("should return 404 on production", async () => {
    vi.stubEnv("SETTINGS", "production");
    const { server } = await startTestServer(globalThis.__MONGO_URI__);

    try {
      const response = await request(server).post(ApiDevEndpoint.CLEAR_DB);
      expect(response.status).toEqual(404);
    } finally {
      await stopTestServer(server);
    }
  });
});

describe(`POST ${ApiDevEndpoint.ADD_PROGRAM_ITEMS}`, () => {
  test("should return 404 on production", async () => {
    vi.stubEnv("SETTINGS", "production");
    const { server } = await startTestServer(globalThis.__MONGO_URI__);

    try {
      const response = await request(server).post(
        ApiDevEndpoint.ADD_PROGRAM_ITEMS,
      );
      expect(response.status).toEqual(404);
    } finally {
      await stopTestServer(server);
    }
  });
});

describe(`POST ${ApiDevEndpoint.ADD_SERIALS}`, () => {
  test("should return 404 on production", async () => {
    vi.stubEnv("SETTINGS", "production");
    const { server } = await startTestServer(globalThis.__MONGO_URI__);

    try {
      const response = await request(server).post(ApiDevEndpoint.ADD_SERIALS);
      expect(response.status).toEqual(404);
    } finally {
      await stopTestServer(server);
    }
  });
});

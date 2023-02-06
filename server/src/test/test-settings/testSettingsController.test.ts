import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { TestSettings } from "shared/test-typings/models/testSettings";

jest.mock("server/utils/logger");

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

afterEach(() => {
  jest.resetModules();
});

afterAll(async () => {
  await mongoServer.stop();
});

describe(`GET ${ApiEndpoint.TEST_SETTINGS}`, () => {
  test("should return 404 on production", async () => {
    process.env.SETTINGS = "production";
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).get(ApiEndpoint.TEST_SETTINGS);
      expect(response.status).toEqual(404);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return default settings", async () => {
    process.env.SETTINGS = "development";
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).get(ApiEndpoint.TEST_SETTINGS);
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

describe(`POST ${ApiEndpoint.TEST_SETTINGS}`, () => {
  test("should return 404 on production", async () => {
    process.env.SETTINGS = "production";
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).post(ApiEndpoint.TEST_SETTINGS);
      expect(response.status).toEqual(404);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 422 with invalid body", async () => {
    process.env.SETTINGS = "development";
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .post(ApiEndpoint.TEST_SETTINGS)
        .send({ testTime: 12345 });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return updated test settings after update", async () => {
    process.env.SETTINGS = "development";
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const testSettings: TestSettings = {
        testTime: "2021-07-16T14:28:01.316Z",
      };

      const response = await request(server)
        .post(ApiEndpoint.TEST_SETTINGS)
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

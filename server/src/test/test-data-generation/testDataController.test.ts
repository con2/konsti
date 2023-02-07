import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";

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

describe(`POST ${ApiEndpoint.POPULATE_DB}`, () => {
  test("should return 404 on production", async () => {
    process.env.SETTINGS = "production";
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).post(ApiEndpoint.POPULATE_DB);
      expect(response.status).toEqual(404);
    } finally {
      await stopTestServer(server);
    }
  });
});

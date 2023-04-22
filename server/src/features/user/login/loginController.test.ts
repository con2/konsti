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
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

vi.mock("server/utils/logger");

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

describe(`POST ${ApiEndpoint.LOGIN}`, () => {
  test("should return 422 without any parameters", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).post(ApiEndpoint.LOGIN);
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 422 if username is found but password is missing", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).post(ApiEndpoint.LOGIN).send({
        username: "testuser",
      });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 422 if password is found but username is missing", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).post(ApiEndpoint.LOGIN).send({
        password: "testpass",
      });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 200 if password and username are found", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .post(ApiEndpoint.LOGIN)
        .send({ username: "testuser", password: "testpass" });
      expect(response.status).toEqual(200);
    } finally {
      await stopTestServer(server);
    }
  });
});

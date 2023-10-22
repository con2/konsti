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
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { UserGroup } from "shared/typings/models/user";
import { getJWT } from "server/utils/jwt";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

afterEach(() => {
  // Start server with different sharedConfig
  vi.resetModules();
});

afterAll(async () => {
  await mongoServer.stop();
});

describe(`GET ${ApiEndpoint.USERS}`, () => {
  test("should return 401 without valid authorization", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).get(ApiEndpoint.USERS);
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server);
    }
  });
});

describe(`GET ${ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME}`, () => {
  test("should return 401 without valid authorization", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).get(
        ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME,
      );
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 422 without valid body", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .get(ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME)
        .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });
});

describe(`POST ${ApiEndpoint.USERS}`, () => {
  test("should return 422 without username", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).post(ApiEndpoint.USERS).send({
        password: "testpass",
        serial: "testserial",
      });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 422 without password", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).post(ApiEndpoint.USERS).send({
        username: "testuser",
        serial: "testserial",
      });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 422 without serial if code is required", async () => {
    vi.doMock("shared/config/sharedConfig", () => ({
      sharedConfig: { requireRegistrationCode: true },
    }));

    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).post(ApiEndpoint.USERS).send({
        username: "testuser",
        password: "testpass",
      });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 200 without serial if code is not required", async () => {
    vi.doMock("shared/config/sharedConfig", () => ({
      sharedConfig: { requireRegistrationCode: false },
    }));

    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).post(ApiEndpoint.USERS).send({
        username: "testuser",
        password: "testpass",
      });
      expect(response.status).toEqual(200);
    } finally {
      await stopTestServer(server);
    }
  });
});

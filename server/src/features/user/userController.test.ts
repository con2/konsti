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
import { ConventionType } from "shared/config/sharedConfig.types";

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

describe(`GET ${ApiEndpoint.USERS}`, () => {
  test("should return 422 without valid body", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).get(ApiEndpoint.USERS);
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 401 without valid authorization", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .get(ApiEndpoint.USERS)
        .query({ username: "testuser" });
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
        ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME
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

  test("should return 422 without serial if convention is live", async () => {
    vi.doMock("shared/config/sharedConfig", () => ({
      sharedConfig: { conventionType: ConventionType.LIVE },
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

  test("should return 200 without serial if convention is remote", async () => {
    vi.doMock("shared/config/sharedConfig", () => ({
      sharedConfig: { conventionType: ConventionType.REMOTE },
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

describe(`POST ${ApiEndpoint.USERS_PASSWORD}`, () => {
  test("should return 422 without valid body", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .post(ApiEndpoint.USERS_PASSWORD)
        .send({
          username: "testuser",
        });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 401 without valid authorization", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .post(ApiEndpoint.USERS_PASSWORD)
        .send({
          username: "testuser",
          password: "testpass",
          requester: "testuser",
        });
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should allow user to change own password", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .post(ApiEndpoint.USERS_PASSWORD)
        .send({
          username: "testuser",
          password: "testpass",
          requester: "testuser",
        })
        .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual("success");
    } finally {
      await stopTestServer(server);
    }
  });

  test("should not allow user to change other user's password", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .post(ApiEndpoint.USERS_PASSWORD)
        .send({
          username: "another_user",
          password: "testpass",
          requester: "testuser",
        })
        .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should allow helper to change other user's password", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .post(ApiEndpoint.USERS_PASSWORD)
        .send({
          username: "another_user",
          password: "testpass",
          requester: "helper",
        })
        .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual("success");
    } finally {
      await stopTestServer(server);
    }
  });

  test("should not allow helper to change password for 'admin' or 'helper' users", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .post(ApiEndpoint.USERS_PASSWORD)
        .send({
          username: "admin",
          password: "testpass",
          requester: "helper",
        })
        .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual("error");
      expect(response.body.errorId).toEqual("notAllowed");

      const response2 = await request(server)
        .post(ApiEndpoint.USERS_PASSWORD)
        .send({
          username: "helper",
          password: "testpass",
          requester: "helper",
        })
        .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
      expect(response2.status).toEqual(200);
      expect(response2.body.status).toEqual("error");
      expect(response2.body.errorId).toEqual("notAllowed");
    } finally {
      await stopTestServer(server);
    }
  });

  test("should allow admin to change password for 'admin' or 'helper' users", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .post(ApiEndpoint.USERS_PASSWORD)
        .send({
          username: "admin",
          password: "testpass",
          requester: "admin",
        })
        .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual("success");

      const response2 = await request(server)
        .post(ApiEndpoint.USERS_PASSWORD)
        .send({
          username: "helper",
          password: "testpass",
          requester: "admin",
        })
        .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
      expect(response2.status).toEqual(200);
      expect(response2.body.status).toEqual("success");
    } finally {
      await stopTestServer(server);
    }
  });
});

import request from "supertest";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { ConventionType } from "shared/config/sharedConfig.types";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { UserGroup } from "shared/typings/models/user";
import { getJWT } from "server/utils/jwt";

jest.mock("server/utils/logger");

afterEach(() => {
  jest.resetModules();
});

describe(`GET ${ApiEndpoint.USERS}`, () => {
  test("should return 422 without valid body", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).get(ApiEndpoint.USERS);
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 401 without valid authorization", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server)
        .get(ApiEndpoint.USERS)
        .query({ username: "testuser" });
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

describe(`GET ${ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME}`, () => {
  test("should return 401 without valid authorization", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).get(
        ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME
      );
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 422 without valid body", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server)
        .get(ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME)
        .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

describe(`POST ${ApiEndpoint.USERS}`, () => {
  test("should return 422 without username", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(ApiEndpoint.USERS).send({
        password: "testpass",
        serial: "testserial",
      });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 422 without password", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(ApiEndpoint.USERS).send({
        username: "testuser",
        serial: "testserial",
      });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 422 without serial if convention is live", async () => {
    jest.mock("shared/config/sharedConfig", () => ({
      sharedConfig: { conventionType: ConventionType.LIVE },
    }));

    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(ApiEndpoint.USERS).send({
        username: "testuser",
        password: "testpass",
      });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 200 without serial if convention is remote", async () => {
    jest.mock("shared/config/sharedConfig", () => ({
      sharedConfig: { conventionType: ConventionType.REMOTE },
    }));

    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(ApiEndpoint.USERS).send({
        username: "testuser",
        password: "testpass",
      });
      expect(response.status).toEqual(200);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

describe(`POST ${ApiEndpoint.USERS_PASSWORD}`, () => {
  test("should return 422 without valid body", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server)
        .post(ApiEndpoint.USERS_PASSWORD)
        .send({
          username: "testuser",
        });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 401 without valid authorization", async () => {
    const { server, mongoServer } = await startTestServer();

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
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 200 with valid body and authorization", async () => {
    const { server, mongoServer } = await startTestServer();

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
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

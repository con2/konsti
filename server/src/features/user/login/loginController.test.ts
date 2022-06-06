import request from "supertest";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

jest.mock("server/utils/logger");

afterEach(() => {
  jest.resetModules();
});

describe(`POST ${ApiEndpoint.LOGIN}`, () => {
  test("should return 422 without any parameters", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(ApiEndpoint.LOGIN);
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 422 if username is found but password is missing", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(ApiEndpoint.LOGIN).send({
        username: "testuser",
      });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 422 if password is found but username is missing", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(ApiEndpoint.LOGIN).send({
        password: "testpass",
      });
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 200 if password and username are found", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server)
        .post(ApiEndpoint.LOGIN)
        .send({ username: "testuser", password: "testpass" });
      expect(response.status).toEqual(200);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

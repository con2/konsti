import request from "supertest";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import {
  LOGIN_ENDPOINT,
  SESSION_RESTORE_ENDPOINT,
} from "shared/constants/apiEndpoints";
import { mockUser } from "server/test/mock-data/mockUser";
import { saveUser } from "server/features/user/userRepository";

describe(`POST ${SESSION_RESTORE_ENDPOINT}`, () => {
  test("should return 422 without any parameters", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(SESSION_RESTORE_ENDPOINT);
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 200 and error message with invalid jwt parameter", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server)
        .post(SESSION_RESTORE_ENDPOINT)
        .send({ jwt: "testjwt" });
      expect(response.status).toEqual(200);
      expect(response.body.message).toEqual("Invalid jwt");
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 200 and success with valid jwt parameter", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const user = await saveUser(mockUser);
      expect(user.password).toEqual(mockUser.passwordHash);

      const loginResponse = await request(server)
        .post(LOGIN_ENDPOINT)
        .send({ username: mockUser.username, password: "password" });

      expect(loginResponse.status).toEqual(200);
      expect(loginResponse.body.message).toEqual("User login success");

      const sessionRestoreResponse = await request(server)
        .post(SESSION_RESTORE_ENDPOINT)
        .send({ jwt: loginResponse.body.jwt });

      expect(sessionRestoreResponse.status).toEqual(200);
      expect(sessionRestoreResponse.body.message).toEqual(
        "Session restore success"
      );
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

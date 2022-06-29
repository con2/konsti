import request from "supertest";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { UserGroup } from "shared/typings/models/user";
import { getJWT } from "server/utils/jwt";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { SignupMessage } from "shared/typings/models/settings";

describe(`GET ${ApiEndpoint.SETTINGS}`, () => {
  process.env.SETTINGS = "production";

  test("should return 200", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).get(ApiEndpoint.SETTINGS);
      expect(response.status).toEqual(200);
      expect(response.body.signupMessages.length).toEqual(1);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

describe(`POST ${ApiEndpoint.SETTINGS}`, () => {
  process.env.SETTINGS = "production";

  test("should return 401 without authorization", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(ApiEndpoint.SETTINGS);
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 401 without admin authorization", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server)
        .post(ApiEndpoint.SETTINGS)
        .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 422 with invalid body", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server)
        .post(ApiEndpoint.SETTINGS)
        .send({ appOpen: "not boolean" })
        .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return updated settings with full or partial update", async () => {
    const { server, mongoServer } = await startTestServer();

    const testSignupMessage: SignupMessage = {
      gameId: "123456",
      message: "Test message",
      private: false,
    };

    const testSettings = {
      hiddenGames: [],
      signupTime: "2021-07-16T14:28:01.316Z",
      appOpen: true,
      signupMessages: [testSignupMessage],
      signupStrategy: SignupStrategy.ALGORITHM,
    };

    try {
      // Full update
      const fullUpdateResponse = await request(server)
        .post(ApiEndpoint.SETTINGS)
        .send(testSettings)
        .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

      expect(fullUpdateResponse.status).toEqual(200);
      expect(fullUpdateResponse.body).toEqual({
        status: "success",
        message: "Update settings success",
        settings: testSettings,
      });

      // Partial update
      const partialUpdateResponse = await request(server)
        .post(ApiEndpoint.SETTINGS)
        .send({ signupStrategy: SignupStrategy.DIRECT })
        .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

      expect(partialUpdateResponse.status).toEqual(200);
      expect(partialUpdateResponse.body).toEqual({
        status: "success",
        message: "Update settings success",
        settings: { ...testSettings, signupStrategy: SignupStrategy.DIRECT },
      });
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

describe(`POST ${ApiEndpoint.HIDDEN}`, () => {
  process.env.SETTINGS = "production";

  test("should return 401 without valid authorization", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(ApiEndpoint.HIDDEN);
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

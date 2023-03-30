import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { UserGroup } from "shared/typings/models/user";
import { getJWT } from "server/utils/jwt";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { Settings, SignupQuestion } from "shared/typings/models/settings";
import { testGame, testGame2 } from "shared/tests/testGame";
import { saveGames } from "server/features/game/gameRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import {
  findUserSignups,
  saveSignup,
} from "server/features/signup/signupRepository";
import { saveFavorite } from "server/features/user/favorite-game/favoriteGameRepository";
import {
  mockPostEnteredGameRequest,
  mockPostEnteredGameRequest2,
  mockSignedGames,
  mockUser,
} from "server/test/mock-data/mockUser";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

afterAll(async () => {
  await mongoServer.stop();
});

describe(`GET ${ApiEndpoint.SETTINGS}`, () => {
  process.env.SETTINGS = "production";

  test("should return 200", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).get(ApiEndpoint.SETTINGS);
      expect(response.status).toEqual(200);
    } finally {
      await stopTestServer(server);
    }
  });
});

describe(`POST ${ApiEndpoint.SETTINGS}`, () => {
  process.env.SETTINGS = "production";

  test("should return 401 without authorization", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).post(ApiEndpoint.SETTINGS);
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 401 without admin authorization", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .post(ApiEndpoint.SETTINGS)
        .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return 422 with invalid body", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server)
        .post(ApiEndpoint.SETTINGS)
        .send({ appOpen: "not boolean" })
        .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should return updated settings with full or partial update", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    const testSignupQuestion: SignupQuestion = {
      gameId: "123456",
      message: "Test message",
      private: false,
    };

    const testSettings: Settings = {
      hiddenGames: [],
      appOpen: true,
      signupQuestions: [testSignupQuestion],
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
      await stopTestServer(server);
    }
  });
});

describe(`POST ${ApiEndpoint.HIDDEN}`, () => {
  process.env.SETTINGS = "production";

  test("should return 401 without valid authorization", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      const response = await request(server).post(ApiEndpoint.HIDDEN);
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server);
    }
  });

  test("should remove hidden game from users", async () => {
    const { server } = await startTestServer(mongoServer.getUri());

    try {
      await saveGames([testGame, testGame2]);
      await saveUser(mockUser);
      await saveSignedGames({
        username: mockUser.username,
        signedGames: mockSignedGames,
      });
      await saveSignup(mockPostEnteredGameRequest);
      await saveSignup(mockPostEnteredGameRequest2);
      await saveFavorite({
        username: mockUser.username,
        favoritedGameIds: [testGame.gameId, testGame2.gameId],
      });

      const response = await request(server)
        .post(ApiEndpoint.HIDDEN)
        .send({ hiddenData: [testGame] })
        .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

      expect(response.status).toEqual(200);

      const updatedUser = await findUser(mockUser.username);
      expect(updatedUser?.signedGames.length).toEqual(1);
      expect(updatedUser?.signedGames[0].gameDetails.title).toEqual(
        testGame2.title
      );
      expect(updatedUser?.favoritedGames.length).toEqual(1);

      const signups = await findUserSignups(mockUser.username);
      expect(signups.length).toEqual(1);
      expect(signups[0].userSignups[0].username).toEqual(mockUser.username);
    } finally {
      await stopTestServer(server);
    }
  });
});

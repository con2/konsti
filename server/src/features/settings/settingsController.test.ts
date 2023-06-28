import { Server } from "http";
import {
  expect,
  test,
  afterAll,
  beforeAll,
  describe,
  afterEach,
  beforeEach,
} from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { UserGroup } from "shared/typings/models/user";
import { getJWT } from "server/utils/jwt";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import {
  Settings,
  SignupQuestion,
  SignupQuestionType,
} from "shared/typings/models/settings";
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
import { closeServer, startServer } from "server/utils/server";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { PostSignupQuestionRequest } from "shared/typings/api/settings";
import {
  findSettings,
  saveSignupQuestion,
} from "server/features/settings/settingsRepository";

let server: Server;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  server = await startServer({
    dbConnString: mongoServer.getUri(),
    dbName: faker.string.alphanumeric(10),
    enableSentry: false,
  });
});

afterEach(async () => {
  await closeServer(server);
});

afterAll(async () => {
  await mongoServer.stop();
});

describe(`GET ${ApiEndpoint.SETTINGS}`, () => {
  test("should return 200", async () => {
    const response = await request(server).get(ApiEndpoint.SETTINGS);
    expect(response.status).toEqual(200);
  });
});

describe(`POST ${ApiEndpoint.SETTINGS}`, () => {
  test("should return 401 without authorization", async () => {
    const response = await request(server).post(ApiEndpoint.SETTINGS);
    expect(response.status).toEqual(401);
  });

  test("should return 401 without admin authorization", async () => {
    const response = await request(server)
      .post(ApiEndpoint.SETTINGS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid body", async () => {
    const response = await request(server)
      .post(ApiEndpoint.SETTINGS)
      .send({ appOpen: "not boolean" })
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    expect(response.status).toEqual(422);
  });

  test("should return updated settings with full or partial update", async () => {
    const testSignupQuestion: SignupQuestion = {
      gameId: "123456",
      questionFi: "Test message",
      questionEn: "public message",
      private: false,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    };

    const testSettings: Settings = {
      hiddenGames: [],
      appOpen: true,
      signupQuestions: [testSignupQuestion],
      signupStrategy: SignupStrategy.ALGORITHM,
    };

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
  });
});

describe(`POST ${ApiEndpoint.HIDDEN}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.HIDDEN);
    expect(response.status).toEqual(401);
  });

  test("should remove hidden game from users", async () => {
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

    const updatedUserResult = await findUser(mockUser.username);
    const updatedUser = unsafelyUnwrapResult(updatedUserResult);
    expect(updatedUser?.signedGames.length).toEqual(1);
    expect(updatedUser?.signedGames[0].gameDetails.title).toEqual(
      testGame2.title
    );
    expect(updatedUser?.favoritedGames.length).toEqual(1);

    const signupsResult = await findUserSignups(mockUser.username);
    const signups = unsafelyUnwrapResult(signupsResult);
    expect(signups.length).toEqual(1);
    expect(signups[0].userSignups[0].username).toEqual(mockUser.username);
  });
});

describe(`POST ${ApiEndpoint.SIGNUP_QUESTION}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.SIGNUP_QUESTION);
    expect(response.status).toEqual(401);
  });

  test("should return 401 with user authorization", async () => {
    const response = await request(server)
      .post(ApiEndpoint.SIGNUP_QUESTION)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(401);
  });

  test("should return 401 with helper authorization", async () => {
    const response = await request(server)
      .post(ApiEndpoint.SIGNUP_QUESTION)
      .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
    expect(response.status).toEqual(401);
  });

  test("should return 200 with admin authorization", async () => {
    const response = await request(server)
      .post(ApiEndpoint.SIGNUP_QUESTION)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
  });

  test("should add new text signup question", async () => {
    const requestData: PostSignupQuestionRequest = {
      signupQuestion: {
        gameId: "123",
        questionFi: "Character level",
        questionEn: "public message",
        private: false,
        type: SignupQuestionType.TEXT,
        selectOptions: [],
      },
    };

    await request(server)
      .post(ApiEndpoint.SIGNUP_QUESTION)
      .send(requestData)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.signupQuestions).toHaveLength(1);
    expect(settings.signupQuestions[0]).toMatchObject(
      requestData.signupQuestion
    );
  });

  test("should add new select signup question", async () => {
    const requestData: PostSignupQuestionRequest = {
      signupQuestion: {
        gameId: "123",
        questionFi: "Character level",
        questionEn: "public message",
        private: false,
        type: SignupQuestionType.SELECT,
        selectOptions: [
          { optionFi: "Option 1", optionEn: "Option 1" },
          { optionFi: "Option 2", optionEn: "Option 2" },
          { optionFi: "Option 3", optionEn: "Option 3" },
        ],
      },
    };

    await request(server)
      .post(ApiEndpoint.SIGNUP_QUESTION)
      .send(requestData)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    const settingsResult = await findSettings();
    const settings = unsafelyUnwrapResult(settingsResult);

    expect(settings.signupQuestions).toHaveLength(1);
    expect(settings.signupQuestions[0]).toMatchObject(
      requestData.signupQuestion
    );
  });

  describe(`DELETE ${ApiEndpoint.SIGNUP_QUESTION}`, () => {
    test("should return 401 without valid authorization", async () => {
      const response = await request(server).post(ApiEndpoint.SIGNUP_QUESTION);
      expect(response.status).toEqual(401);
    });

    test("should return 401 with user authorization", async () => {
      const response = await request(server)
        .post(ApiEndpoint.SIGNUP_QUESTION)
        .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
      expect(response.status).toEqual(401);
    });

    test("should return 401 with helper authorization", async () => {
      const response = await request(server)
        .post(ApiEndpoint.SIGNUP_QUESTION)
        .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
      expect(response.status).toEqual(401);
    });

    test("should return 200 with admin authorization", async () => {
      const response = await request(server)
        .post(ApiEndpoint.SIGNUP_QUESTION)
        .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
      expect(response.status).toEqual(200);
    });

    test("should delete signup question", async () => {
      const signupQuestion: SignupQuestion = {
        gameId: "123",
        questionFi: "Character level",
        questionEn: "public message",
        private: false,
        type: SignupQuestionType.SELECT,
        selectOptions: [
          { optionFi: "Option 1", optionEn: "Option 1" },
          { optionFi: "Option 2", optionEn: "Option 2" },
          { optionFi: "Option 3", optionEn: "Option 3" },
        ],
      };

      await saveSignupQuestion(signupQuestion);

      const settingsResult = await findSettings();
      const settings = unsafelyUnwrapResult(settingsResult);
      expect(settings.signupQuestions).toHaveLength(1);

      await request(server)
        .delete(ApiEndpoint.SIGNUP_QUESTION)
        .send({ gameId: "123" })
        .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

      const updatedSettingsResult = await findSettings();
      const updatedSettings = unsafelyUnwrapResult(updatedSettingsResult);
      expect(updatedSettings.signupQuestions).toHaveLength(0);
    });
  });
});

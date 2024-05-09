import { Server } from "http";
import { afterEach, beforeEach, expect, test, describe } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getJWT } from "server/utils/jwt";
import { UserGroup } from "shared/types/models/user";
import { closeServer, startServer } from "server/utils/server";
import { saveGames } from "server/features/program-item/programItemRepository";
import { saveUser } from "server/features/user/userRepository";
import {
  mockPostDirectSignupRequest,
  mockPostDirectSignupRequest2,
  mockUser,
} from "server/test/mock-data/mockUser";
import { testGame, testGame2 } from "shared/tests/testGame";
import {
  SignupQuestion,
  SignupQuestionType,
} from "shared/types/models/settings";
import {
  createSettings,
  saveSignupQuestion,
} from "server/features/settings/settingsRepository";
import { saveDirectSignup } from "server/features/direct-signup/directSignupRepository";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
    enableSentry: false,
  });
});

afterEach(async () => {
  await closeServer(server);
});

describe(`GET ${ApiEndpoint.SIGNUP_MESSAGE}`, () => {
  test("should return 401 without authorization", async () => {
    const response = await request(server).get(ApiEndpoint.SIGNUP_MESSAGE);
    expect(response.status).toEqual(401);
  });

  test("should return 401 with normal user authorization", async () => {
    const response = await request(server)
      .get(ApiEndpoint.SIGNUP_MESSAGE)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testUser")}`);
    expect(response.status).toEqual(401);
  });

  test("should return 200 with helper authorization", async () => {
    await createSettings();

    const testSignupQuestion: SignupQuestion = {
      gameId: testGame.gameId,
      questionFi: "Public signup question",
      questionEn: "public message",
      private: false,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    };

    const testSignupQuestion2: SignupQuestion = {
      gameId: testGame2.gameId,
      questionFi: "Private signup question",
      questionEn: "public message",
      private: true,
      type: SignupQuestionType.SELECT,
      selectOptions: [
        { optionFi: "Option 1", optionEn: "Option 1" },
        { optionFi: "Option 2", optionEn: "Option 2" },
        { optionFi: "Option 3", optionEn: "Option 3" },
      ],
    };

    await saveSignupQuestion(testSignupQuestion);
    await saveSignupQuestion(testSignupQuestion2);

    await saveGames([testGame, testGame2]);
    await saveUser(mockUser);

    await saveDirectSignup({
      ...mockPostDirectSignupRequest,
      message: "Answer to public message",
    });
    await saveDirectSignup({
      ...mockPostDirectSignupRequest2,
      message: "Select Option 1",
    });

    const response = await request(server)
      .get(ApiEndpoint.SIGNUP_MESSAGE)
      .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);

    expect(response.status).toEqual(200);
    expect(response.body.signupMessages.length).toEqual(2);
  });
});

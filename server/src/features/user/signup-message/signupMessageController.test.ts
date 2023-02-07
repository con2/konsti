import { Server } from "http";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getJWT } from "server/utils/jwt";
import { UserGroup } from "shared/typings/models/user";
import { closeServer, startServer } from "server/utils/server";
import { saveGames } from "server/features/game/gameRepository";
import { saveUser } from "server/features/user/userRepository";
import {
  mockPostEnteredGameRequest,
  mockPostEnteredGameRequest2,
  mockUser,
} from "server/test/mock-data/mockUser";
import { testGame, testGame2 } from "shared/tests/testGame";
import { SignupQuestion } from "shared/typings/models/settings";
import { saveSignupQuestion } from "server/features/settings/settingsRepository";
import { saveSignup } from "server/features/signup/signupRepository";

let server: Server;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  server = await startServer({
    dbConnString: mongoServer.getUri(),
    dbName: faker.random.alphaNumeric(10),
    enableSentry: false,
  });
});

afterEach(async () => {
  await closeServer(server);
});

afterAll(async () => {
  await mongoServer.stop();
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
    const testSignupQuestion: SignupQuestion = {
      gameId: testGame.gameId,
      message: "Public signup question",
      private: false,
    };

    const testSignupQuestion2: SignupQuestion = {
      gameId: testGame2.gameId,
      message: "Private signup question",
      private: true,
    };

    await saveSignupQuestion(testSignupQuestion);
    await saveSignupQuestion(testSignupQuestion2);

    await saveGames([testGame, testGame2]);
    await saveUser(mockUser);

    await saveSignup({
      ...mockPostEnteredGameRequest,
      message: "Answer to public message",
    });
    await saveSignup({
      ...mockPostEnteredGameRequest2,
      message: "Answer to private message",
    });

    const response = await request(server)
      .get(ApiEndpoint.SIGNUP_MESSAGE)
      .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);

    expect(response.status).toEqual(200);
    expect(response.body.signupMessages.length).toEqual(2);
  });
});

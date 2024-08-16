import { Server } from "http";
import { expect, test, describe, afterEach, beforeEach } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { UserGroup } from "shared/types/models/user";
import { getJWT } from "server/utils/jwt";
import { LoginProvider, SignupStrategy } from "shared/config/eventConfigTypes";
import {
  Settings,
  SignupQuestion,
  SignupQuestionType,
} from "shared/types/models/settings";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import {
  findDirectSignups,
  findUserDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { saveFavorite } from "server/features/user/favorite-program-item/favoriteProgramItemRepository";
import {
  mockPostDirectSignupRequest,
  mockPostDirectSignupRequest2,
  mockLotterySignups,
  mockUser,
} from "server/test/mock-data/mockUser";
import { closeServer, startServer } from "server/utils/server";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import {
  DeleteSignupQuestionRequest,
  PostSignupQuestionRequest,
} from "shared/types/api/settings";
import {
  createSettings,
  findSettings,
  saveSignupQuestion,
} from "server/features/settings/settingsRepository";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await closeServer(server);
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
      programItemId: "123456",
      questionFi: "Test message",
      questionEn: "public message",
      private: false,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    };

    // Full update
    const testSettings: Settings = {
      hiddenProgramItems: [],
      appOpen: true,
      signupQuestions: [testSignupQuestion],
      signupStrategy: SignupStrategy.ALGORITHM,
      programUpdateLastRun: "2023-05-07T07:00:00.000Z",
      assignmentLastRun: "2023-05-07T07:00:00.000Z",
      latestServerStartTime: "2023-05-07T07:00:00.000Z",
      loginProvider: LoginProvider.LOCAL,
    };

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
    const partialSettings: Partial<Settings> = {
      signupStrategy: SignupStrategy.DIRECT,
    };

    const partialUpdateResponse = await request(server)
      .post(ApiEndpoint.SETTINGS)
      .send(partialSettings)
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

  test("should remove hidden program item from users", async () => {
    await saveProgramItems([testProgramItem, testProgramItem2]);
    await saveUser(mockUser);
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: mockLotterySignups,
    });
    await saveDirectSignup(mockPostDirectSignupRequest);
    await saveDirectSignup(mockPostDirectSignupRequest2);
    await saveFavorite({
      username: mockUser.username,
      favoriteProgramItemIds: [
        testProgramItem.programItemId,
        testProgramItem2.programItemId,
      ],
    });

    const response = await request(server)
      .post(ApiEndpoint.HIDDEN)
      .send({ hiddenData: [testProgramItem] })
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    expect(response.status).toEqual(200);

    const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
    expect(updatedUser?.lotterySignups.length).toEqual(1);
    expect(updatedUser?.lotterySignups[0].programItem.title).toEqual(
      testProgramItem2.title,
    );
    expect(updatedUser?.favoriteProgramItemIds.length).toEqual(1);

    const signups = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(signups.length).toEqual(1);
    expect(signups[0].userSignups[0].username).toEqual(mockUser.username);
  });

  test("should clean but not remove signup document when program item is hidden", async () => {
    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);
    await saveDirectSignup(mockPostDirectSignupRequest);

    const signups = unsafelyUnwrap(await findDirectSignups());
    expect(signups).toHaveLength(1);
    expect(signups[0].userSignups).toHaveLength(1);
    expect(signups[0].count).toEqual(1);

    await request(server)
      .post(ApiEndpoint.HIDDEN)
      .send({ hiddenData: [testProgramItem] })
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    const signups2 = unsafelyUnwrap(await findDirectSignups());
    expect(signups2).toHaveLength(1);
    expect(signups2[0].userSignups).toEqual([]);
    expect(signups2[0].count).toEqual(0);
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
    const requestData: PostSignupQuestionRequest = {
      signupQuestion: {
        programItemId: "123",
        questionFi: "Character level",
        questionEn: "public message",
        private: false,
        type: SignupQuestionType.TEXT,
        selectOptions: [],
      },
    };

    const response = await request(server)
      .post(ApiEndpoint.SIGNUP_QUESTION)
      .send(requestData)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
  });

  test("should add new text signup question", async () => {
    await createSettings();

    const requestData: PostSignupQuestionRequest = {
      signupQuestion: {
        programItemId: "123",
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

    const settings = unsafelyUnwrap(await findSettings());

    expect(settings.signupQuestions).toHaveLength(1);
    expect(settings.signupQuestions[0]).toMatchObject(
      requestData.signupQuestion,
    );
  });

  test("should add new select signup question", async () => {
    await createSettings();

    const requestData: PostSignupQuestionRequest = {
      signupQuestion: {
        programItemId: "123",
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

    const settings = unsafelyUnwrap(await findSettings());

    expect(settings.signupQuestions).toHaveLength(1);
    expect(settings.signupQuestions[0]).toMatchObject(
      requestData.signupQuestion,
    );
  });
});

describe(`DELETE ${ApiEndpoint.SIGNUP_QUESTION}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).delete(ApiEndpoint.SIGNUP_QUESTION);
    expect(response.status).toEqual(401);
  });

  test("should return 401 with user authorization", async () => {
    const response = await request(server)
      .delete(ApiEndpoint.SIGNUP_QUESTION)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(401);
  });

  test("should return 401 with helper authorization", async () => {
    const response = await request(server)
      .delete(ApiEndpoint.SIGNUP_QUESTION)
      .set("Authorization", `Bearer ${getJWT(UserGroup.HELP, "helper")}`);
    expect(response.status).toEqual(401);
  });

  test("should return 200 with admin authorization", async () => {
    const requestData: DeleteSignupQuestionRequest = { programItemId: "123" };

    const response = await request(server)
      .delete(ApiEndpoint.SIGNUP_QUESTION)
      .send(requestData)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
  });

  test("should delete signup question", async () => {
    await createSettings();

    const signupQuestion: SignupQuestion = {
      programItemId: "123",
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

    const settings = unsafelyUnwrap(await findSettings());
    expect(settings.signupQuestions).toHaveLength(1);

    await request(server)
      .delete(ApiEndpoint.SIGNUP_QUESTION)
      .send({ programItemId: "123" })
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    const updatedSettings = unsafelyUnwrap(await findSettings());
    expect(updatedSettings.signupQuestions).toHaveLength(0);
  });
});

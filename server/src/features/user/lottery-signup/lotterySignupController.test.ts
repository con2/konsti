import { Server } from "node:http";
import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getJWT } from "server/utils/jwt";
import { UserGroup } from "shared/types/models/user";
import { closeServer, startServer } from "server/utils/server";
import { testProgramItem } from "shared/tests/testProgramItem";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import { mockLotterySignups, mockUser } from "server/test/mock-data/mockUser";
import {
  PostLotterySignupResponse,
  PostLotterySignupError,
  PostLotterySignupRequest,
  DeleteLotterySignupRequest,
  DeleteLotterySignupError,
} from "shared/types/api/myProgramItems";
import { config } from "shared/config";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { SignupType, State } from "shared/types/models/programItem";

let server: Server;

beforeEach(async () => {
  // Signup start defaults to 'eventStartTime' if before
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    eventStartTime: dayjs(testProgramItem.startTime)
      .subtract(config.event().preSignupStart, "minutes")
      .toISOString(),
  });
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  vi.resetAllMocks();
  await closeServer(server);
});

describe(`POST ${ApiEndpoint.LOTTERY_SIGNUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.LOTTERY_SIGNUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 without valid body", async () => {
    const response = await request(server)
      .post(ApiEndpoint.LOTTERY_SIGNUP)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(422);
  });

  test("should return error when signup is not yet open", async () => {
    vi.setSystemTime(
      dayjs(testProgramItem.startTime)
        .subtract(config.event().preSignupStart + 1, "minutes")
        .toISOString(),
    );

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);

    const signup: PostLotterySignupRequest = {
      programItemId: testProgramItem.programItemId,
      priority: 1,
    };
    const response = await request(server)
      .post(ApiEndpoint.LOTTERY_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostLotterySignupError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("signupNotOpenYet");
  });

  test("should return error when signup is closed", async () => {
    vi.setSystemTime(
      dayjs(testProgramItem.startTime).add(1, "second").toISOString(),
    );

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);

    const signup: PostLotterySignupRequest = {
      programItemId: testProgramItem.programItemId,
      priority: 1,
    };
    const response = await request(server)
      .post(ApiEndpoint.LOTTERY_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as PostLotterySignupError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("signupEnded");
  });

  test("should return error when program item is not found", async () => {
    vi.setSystemTime(
      dayjs(testProgramItem.startTime).subtract(1, "hour").toISOString(),
    );
    await saveUser(mockUser);

    const signup: PostLotterySignupRequest = {
      programItemId: "not-found",
      priority: 1,
    };
    const response = await request(server)
      .post(ApiEndpoint.LOTTERY_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostLotterySignupError;
    expect(body.status).toEqual("error");
    expect(body.message).toEqual("Program item not found: not-found");
  });

  test("should return error when program item is cancelled", async () => {
    await saveProgramItems([{ ...testProgramItem, state: State.CANCELLED }]);
    await saveUser(mockUser);

    const signup: PostLotterySignupRequest = {
      programItemId: testProgramItem.programItemId,
      priority: 1,
    };
    const response = await request(server)
      .post(ApiEndpoint.LOTTERY_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostLotterySignupError;
    expect(body.status).toEqual("error");
    expect(body.message).toEqual("Program item is cancelled");
  });

  test("should return error when program item doesn't use Konsti signup", async () => {
    await saveProgramItems([
      { ...testProgramItem, signupType: SignupType.OTHER },
    ]);
    await saveUser(mockUser);

    const signup: PostLotterySignupRequest = {
      programItemId: testProgramItem.programItemId,
      priority: 1,
    };
    const response = await request(server)
      .post(ApiEndpoint.LOTTERY_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostLotterySignupError;
    expect(body.status).toEqual("error");
    expect(body.message).toEqual("No Konsti signup for this program item");
  });

  test("should return error when user is not found", async () => {
    vi.setSystemTime(
      dayjs(testProgramItem.startTime)
        .subtract(config.event().preSignupStart, "minutes")
        .toISOString(),
    );

    await saveProgramItems([testProgramItem]);

    const signup: PostLotterySignupRequest = {
      programItemId: testProgramItem.programItemId,
      priority: 1,
    };
    const response = await request(server)
      .post(ApiEndpoint.LOTTERY_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, "user_not_found")}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostLotterySignupError;
    expect(body.status).toEqual("error");
    expect(body.message).toEqual("Error finding user");
  });

  test("should return error if priority already selected", async () => {
    vi.setSystemTime(
      dayjs(testProgramItem.startTime)
        .subtract(config.event().preSignupStart, "minutes")
        .toISOString(),
    );

    const reservedPriority = 1;

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        {
          ...mockLotterySignups[0],
          priority: reservedPriority,
        },
      ],
    });

    const signup: PostLotterySignupRequest = {
      programItemId: testProgramItem.programItemId,
      priority: reservedPriority,
    };
    const response = await request(server)
      .post(ApiEndpoint.LOTTERY_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostLotterySignupError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("samePriority");
  });

  test("should return error if invalid priority value", async () => {
    const signup: PostLotterySignupRequest = {
      programItemId: testProgramItem.programItemId,
      priority: 4,
    };
    const response = await request(server)
      .post(ApiEndpoint.LOTTERY_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostLotterySignupError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("invalidPriority");
  });

  test("should return success when user and program item are found", async () => {
    vi.setSystemTime(
      dayjs(testProgramItem.startTime)
        .subtract(config.event().preSignupStart, "minutes")
        .toISOString(),
    );

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);

    const signup: PostLotterySignupRequest = {
      programItemId: testProgramItem.programItemId,
      priority: 1,
    };
    const response = await request(server)
      .post(ApiEndpoint.LOTTERY_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostLotterySignupResponse;
    expect(body.message).toEqual("Lottery signup success");
    expect(body.status).toEqual("success");

    const modifiedUser = unsafelyUnwrap(await findUser(mockUser.username));
    expect(modifiedUser?.lotterySignups).toHaveLength(1);
    expect(modifiedUser?.lotterySignups[0].programItemId).toEqual(
      testProgramItem.programItemId,
    );
    expect(modifiedUser?.lotterySignups[0].priority).toEqual(1);
  });
});

describe(`DELETE ${ApiEndpoint.LOTTERY_SIGNUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).delete(ApiEndpoint.LOTTERY_SIGNUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid parameters", async () => {
    const deleteRequest: Partial<DeleteLotterySignupRequest> = {};
    const response = await request(server)
      .delete(ApiEndpoint.LOTTERY_SIGNUP)
      .send(deleteRequest)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(422);
  });

  test("should return error when signup is closed", async () => {
    vi.setSystemTime(
      dayjs(testProgramItem.startTime).add(1, "second").toISOString(),
    );

    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);

    const signup: DeleteLotterySignupRequest = {
      lotterySignupProgramItemId: testProgramItem.programItemId,
    };
    const response = await request(server)
      .delete(ApiEndpoint.LOTTERY_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as DeleteLotterySignupError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("signupEnded");
  });

  test("should return error when program item is not found", async () => {
    vi.setSystemTime(
      dayjs(testProgramItem.startTime).subtract(1, "hour").toISOString(),
    );
    await saveUser(mockUser);

    const signup: DeleteLotterySignupRequest = {
      lotterySignupProgramItemId: "not-found",
    };
    const response = await request(server)
      .delete(ApiEndpoint.LOTTERY_SIGNUP)
      .send(signup)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as DeleteLotterySignupError;
    expect(body.status).toEqual("error");
    expect(body.message).toEqual("Program item not found: not-found");
  });

  test("should return success on completed delete", async () => {
    vi.setSystemTime(
      dayjs(testProgramItem.startTime)
        .subtract(config.event().preSignupStart + 1, "minutes")
        .toISOString(),
    );
    await saveProgramItems([testProgramItem]);
    await saveUser(mockUser);
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: [
        {
          ...mockLotterySignups[0],
          priority: 1,
        },
      ],
    });

    const unmodifiedUser = unsafelyUnwrap(await findUser(mockUser.username));
    expect(unmodifiedUser?.lotterySignups).toHaveLength(1);

    /*
    const deleteRequest: DeleteLotterySignupRequest = {
      lotterySignupProgramItemId: testProgramItem.programItemId,
    };

    const response = await request(server)
      .delete(ApiEndpoint.LOTTERY_SIGNUP)
      .send(deleteRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostLotterySignupResponse;
    expect(body.message).toEqual("Lottery signup remove success");
    expect(body.status).toEqual("success");

    const modifiedUser = unsafelyUnwrap(await findUser(mockUser.username));
    expect(modifiedUser?.lotterySignups).toHaveLength(0);
    */
  });
});

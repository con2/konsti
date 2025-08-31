import { Server } from "node:http";
import { expect, test, afterEach, beforeEach, describe, vi } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetGroupError,
  GetGroupResponse,
  PostCloseGroupRequest,
  PostJoinGroupRequest,
} from "shared/types/api/groups";
import { UserGroup } from "shared/types/models/user";
import { getJWT } from "server/utils/jwt";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockPostDirectSignupRequest,
  mockLotterySignups,
  mockUser,
  mockUser2,
} from "server/test/mock-data/mockUser";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { closeServer, startServer } from "server/utils/server";
import { saveDirectSignup } from "server/features/direct-signup/directSignupRepository";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { config } from "shared/config";
import { ProgramType } from "shared/types/models/programItem";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  vi.resetAllMocks();
  await closeServer(server);
});

describe(`GET ${ApiEndpoint.GROUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).get(ApiEndpoint.GROUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 without valid body", async () => {
    const response = await request(server)
      .get(ApiEndpoint.GROUP)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`,
      );
    expect(response.status).toEqual(422);
  });

  test("should return group members", async () => {
    await saveProgramItems([testProgramItem]);
    await saveUser({
      ...mockUser,
      groupCode: mockUser.serial,
      groupCreatorCode: mockUser.serial,
    });
    await saveUser({ ...mockUser2, groupCode: mockUser.serial });
    await saveDirectSignup({
      ...mockPostDirectSignupRequest,
      username: mockUser2.username,
    });

    const response = await request(server)
      .get(ApiEndpoint.GROUP)
      .query({
        username: mockUser2.username,
        groupCode: mockUser.serial,
      })
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as GetGroupResponse;
    expect(body.status).toEqual("success");
    expect(body.results.length).toEqual(2);
  });
});

describe(`POST ${ApiEndpoint.GROUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.GROUP);
    expect(response.status).toEqual(401);
  });

  test("should create group", async () => {
    const user = unsafelyUnwrap(await saveUser(mockUser));
    expect(user.groupCode).toEqual("0");

    const response = await request(server)
      .post(ApiEndpoint.GROUP)
      .send({})
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);
    const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
    expect(updatedUser?.groupCode).toEqual(updatedUser?.groupCreatorCode);

    const groupCodeMatcher = new RegExp(
      "^[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}$",
    );
    expect(groupCodeMatcher.test(updatedUser?.groupCode ?? "")).toBeTruthy();
  });
});

describe(`POST ${ApiEndpoint.JOIN_GROUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.JOIN_GROUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 without valid body", async () => {
    const response = await request(server)
      .post(ApiEndpoint.JOIN_GROUP)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`,
      );
    expect(response.status).toEqual(422);
  });

  test("should join group and remove upcoming lottery signups", async () => {
    const timeNow = dayjs(testProgramItem.startTime).toISOString();
    const pastStartTime = timeNow;
    const upcomingStartTime = dayjs(testProgramItem.startTime)
      .add(1, "minute")
      .toISOString();

    await saveTestSettings({
      testTime: timeNow,
    });

    const groupCode = "123-234-345";

    // Upcoming lottery signup is determined from program item start time, not signup time
    await saveProgramItems([
      { ...testProgramItem, startTime: pastStartTime },
      {
        ...testProgramItem2,
        startTime: upcomingStartTime,
      },
    ]);
    await saveUser({ ...mockUser, groupCode, groupCreatorCode: groupCode });
    await saveUser(mockUser2);

    const pastLotterySignup = {
      ...mockLotterySignups[0],
      signedToStartTime: pastStartTime,
    };
    const upcomingLotterySignup = {
      ...mockLotterySignups[1],
      signedToStartTime: upcomingStartTime,
    };
    const user = unsafelyUnwrap(
      await saveLotterySignups({
        lotterySignups: [pastLotterySignup, upcomingLotterySignup],
        username: mockUser2.username,
      }),
    );
    expect(user.lotterySignups.length).toEqual(2);

    const groupRequest: PostJoinGroupRequest = {
      groupCode,
    };

    const response = await request(server)
      .post(ApiEndpoint.JOIN_GROUP)
      .send(groupRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`,
      );
    expect(response.status).toEqual(200);

    const updatedUser = unsafelyUnwrap(await findUser(mockUser2.username));
    expect(updatedUser?.groupCode).toEqual(groupCode);
    expect(updatedUser?.lotterySignups.length).toEqual(1);
    expect(updatedUser?.lotterySignups[0].programItemId).toEqual(
      pastLotterySignup.programItemId,
    );
  });

  test("should join group and not remove upcoming lottery signup with parent startTime in past", async () => {
    const timeNow = dayjs(testProgramItem.startTime).toISOString();
    const parentStartTime = dayjs(timeNow)
      .subtract(30, "minutes")
      .toISOString();
    const upcomingStartTime = dayjs(timeNow).add(1, "minute").toISOString();

    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      startTimesByParentIds: new Map([
        [testProgramItem.parentId, parentStartTime],
      ]),
    });

    await saveTestSettings({
      testTime: timeNow,
    });

    const groupCode = "123-234-345";

    await saveProgramItems([
      { ...testProgramItem, startTime: upcomingStartTime },
    ]);
    await saveUser({ ...mockUser, groupCode, groupCreatorCode: groupCode });
    await saveUser(mockUser2);

    const upcomingLotterySignup = {
      ...mockLotterySignups[0],
      signedToStartTime: upcomingStartTime,
    };
    await saveLotterySignups({
      lotterySignups: [upcomingLotterySignup],
      username: mockUser2.username,
    });

    const groupRequest: PostJoinGroupRequest = {
      groupCode,
    };

    const response = await request(server)
      .post(ApiEndpoint.JOIN_GROUP)
      .send(groupRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`,
      );
    expect(response.status).toEqual(200);

    const updatedUser = unsafelyUnwrap(await findUser(mockUser2.username));
    expect(updatedUser?.groupCode).toEqual(groupCode);
    expect(updatedUser?.lotterySignups.length).toEqual(1);
    expect(updatedUser?.lotterySignups[0].programItemId).toEqual(
      upcomingLotterySignup.programItemId,
    );
  });

  test("should return error if existing upcoming direct signups", async () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
    });

    await saveTestSettings({
      testTime: dayjs(testProgramItem.startTime)
        .subtract(2, "hours")
        .toISOString(),
    });

    await saveProgramItems([testProgramItem]);
    await saveUser({
      ...mockUser,
      groupCode: mockUser.serial,
      groupCreatorCode: mockUser.serial,
    });
    await saveUser(mockUser2);
    await saveDirectSignup({
      ...mockPostDirectSignupRequest,
      username: mockUser2.username,
    });

    const groupRequest: PostJoinGroupRequest = {
      groupCode: mockUser.serial,
    };

    const response = await request(server)
      .post(ApiEndpoint.JOIN_GROUP)
      .send(groupRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`,
      );

    expect(response.status).toEqual(200);

    const body = response.body as GetGroupError;
    expect(body.status).toEqual("error");
    expect(body.message).toEqual("User has upcoming direct signups");
  });
});

describe(`POST ${ApiEndpoint.LEAVE_GROUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.LEAVE_GROUP);
    expect(response.status).toEqual(401);
  });

  test("should leave group", async () => {
    await saveUser({
      ...mockUser,
      groupCode: mockUser.serial,
      groupCreatorCode: mockUser.serial,
    });
    await saveUser({ ...mockUser2, groupCode: mockUser.serial });

    const response = await request(server)
      .post(ApiEndpoint.LEAVE_GROUP)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`,
      );

    expect(response.status).toEqual(200);
    const updatedUser = unsafelyUnwrap(await findUser(mockUser2.username));
    expect(updatedUser?.groupCode).toEqual("0");
  });
});

describe(`POST ${ApiEndpoint.CLOSE_GROUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.CLOSE_GROUP);
    expect(response.status).toEqual(401);
  });

  test("should return 422 without valid body", async () => {
    const response = await request(server)
      .post(ApiEndpoint.CLOSE_GROUP)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(422);
  });

  test("should close group and remove all group members", async () => {
    const groupCode = "abc-dfg-hij";

    await saveUser({ ...mockUser, groupCode, groupCreatorCode: groupCode });
    await saveUser({ ...mockUser2, groupCode });

    const groupRequest: PostCloseGroupRequest = {
      groupCode,
    };

    const response = await request(server)
      .post(ApiEndpoint.CLOSE_GROUP)
      .send(groupRequest)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    expect(response.status).toEqual(200);
    const updatedUser = unsafelyUnwrap(await findUser(mockUser2.username));
    expect(updatedUser?.groupCode).toEqual("0");
    const updatedUser2 = unsafelyUnwrap(await findUser(mockUser2.username));
    expect(updatedUser2?.groupCode).toEqual("0");
  });
});

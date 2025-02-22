import { Server } from "node:http";
import { expect, test, afterEach, beforeEach, describe } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
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
    await saveUser({ ...mockUser, groupCode: mockUser.serial });
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("success");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.results.length).toEqual(2);
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

  test("should join group", async () => {
    const groupCode = "123-234-345";

    await saveProgramItems([testProgramItem, testProgramItem2]);
    await saveUser({ ...mockUser, groupCode, groupCreatorCode: groupCode });
    await saveUser(mockUser2);
    const userWithSignups = unsafelyUnwrap(
      await saveLotterySignups({
        lotterySignups: mockLotterySignups,
        username: mockUser2.username,
      }),
    );
    expect(userWithSignups.lotterySignups.length).toEqual(2);

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
    expect(updatedUser?.lotterySignups.length).toEqual(0);
  });

  test("should return error if existing upcoming signups", async () => {
    await saveTestSettings({
      testTime: dayjs(testProgramItem.startTime)
        .subtract(2, "hours")
        .toISOString(),
    });

    await saveProgramItems([testProgramItem]);
    await saveUser({ ...mockUser, groupCode: mockUser.serial });
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toEqual("error");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.message).toEqual("Signup in future");
  });
});

describe(`POST ${ApiEndpoint.LEAVE_GROUP}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.LEAVE_GROUP);
    expect(response.status).toEqual(401);
  });

  test("should leave group", async () => {
    await saveUser({ ...mockUser, groupCode: mockUser.serial });
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

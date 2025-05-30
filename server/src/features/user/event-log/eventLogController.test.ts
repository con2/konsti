import { Server } from "node:http";
import { expect, test, afterEach, beforeEach, describe } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import mongoose from "mongoose";
import dayjs from "dayjs";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getJWT } from "server/utils/jwt";
import { UserGroup } from "shared/types/models/user";
import { mockUser } from "server/test/mock-data/mockUser";
import { findUser, saveUser } from "server/features/user/userRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import {
  PostEventLogIsSeenRequest,
  PostEventLogIsSeenResponse,
} from "shared/types/api/eventLog";
import { addEventLogItems } from "server/features/user/event-log/eventLogRepository";
import { EventLogAction } from "shared/types/models/eventLog";

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

describe(`POST ${ApiEndpoint.EVENT_LOG_IS_SEEN}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.EVENT_LOG_IS_SEEN);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid parameters", async () => {
    const data: Partial<PostEventLogIsSeenRequest> = {
      isSeen: true,
    };
    const response = await request(server)
      .post(ApiEndpoint.EVENT_LOG_IS_SEEN)
      .send(data)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );
    expect(response.status).toEqual(422);
  });

  test("should return error when user is not found", async () => {
    const eventLogItemId = new mongoose.Types.ObjectId();

    const data: PostEventLogIsSeenRequest = {
      eventLogItemId: String(eventLogItemId),
      isSeen: true,
    };
    const response = await request(server)
      .post(ApiEndpoint.EVENT_LOG_IS_SEEN)
      .send(data)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, "user_not_found")}`,
      );
    expect(response.status).toEqual(200);

    const body = response.body as PostEventLogIsSeenResponse;
    expect(body.status).toEqual("error");
    expect(body.message).toEqual("Unable to update event log item isSeen");
  });

  test("should return error when log item is not found", async () => {
    await saveUser(mockUser);

    const eventLogItemId = new mongoose.Types.ObjectId();

    const data: PostEventLogIsSeenRequest = {
      eventLogItemId: String(eventLogItemId),
      isSeen: true,
    };
    const response = await request(server)
      .post(ApiEndpoint.EVENT_LOG_IS_SEEN)
      .send(data)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    const body = response.body as PostEventLogIsSeenResponse;
    expect(body.status).toEqual("error");
    expect(body.message).toEqual("Unable to update event log item isSeen");
  });

  test("should return success when event log marked as seen", async () => {
    await saveUser(mockUser);
    await addEventLogItems({
      updates: [
        {
          username: mockUser.username,
          programItemId: "123",
          programItemStartTime: dayjs().toISOString(),
          createdAt: dayjs().toISOString(),
        },
      ],
      action: EventLogAction.NEW_ASSIGNMENT,
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Fine in test
    const user = unsafelyUnwrap(await findUser(mockUser.username))!;

    const data: PostEventLogIsSeenRequest = {
      eventLogItemId: user.eventLogItems[0].eventLogItemId,
      isSeen: true,
    };
    const response = await request(server)
      .post(ApiEndpoint.EVENT_LOG_IS_SEEN)
      .send(data)
      .set(
        "Authorization",
        `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`,
      );

    const body = response.body as PostEventLogIsSeenResponse;
    expect(body.status).toEqual("success");
    expect(body.message).toEqual("Event saved");

    const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
    expect(updatedUser?.eventLogItems[0].isSeen).toEqual(true);
  });
});

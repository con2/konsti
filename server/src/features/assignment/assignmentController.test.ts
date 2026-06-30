import { Server } from "node:http";
import { expect, test, afterEach, beforeEach, describe, vi } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostAssignmentRequest,
  PostAssignmentResponse,
  PostAssignmentError,
} from "shared/types/api/assignment";
import { UserGroup } from "shared/types/models/user";
import { getJWT } from "server/utils/jwt";
import {
  acquireAssignmentLock,
  findSettings,
} from "server/features/settings/settingsRepository";
import {
  createNotificationQueueService,
  getGlobalNotificationQueueService,
} from "server/utils/notificationQueue";
import { EmailSender } from "server/features/notifications/email";

vi.mock<object>(
  import("server/utils/notificationQueue"),
  async (originalImport) => {
    const actual = await originalImport();
    return {
      ...actual,
      getGlobalNotificationQueueService: vi.fn(),
    };
  },
);

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
  });
  vi.mocked(getGlobalNotificationQueueService).mockReturnValue(
    createNotificationQueueService(new EmailSender(), 1, true),
  );
});

afterEach(async () => {
  vi.resetAllMocks();
  await closeServer(server);
});

describe(`POST ${ApiEndpoint.ASSIGNMENT}`, () => {
  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.ASSIGNMENT);
    expect(response.status).toEqual(401);
  });

  test("should return 401 with user authorization", async () => {
    const response = await request(server)
      .post(ApiEndpoint.ASSIGNMENT)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "username")}`);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid parameters", async () => {
    const data: Partial<PostAssignmentRequest> = {};
    const response = await request(server)
      .post(ApiEndpoint.ASSIGNMENT)
      .send(data)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(422);
  });

  test("should return 200 with admin authorization", async () => {
    const data: PostAssignmentRequest = {
      assignmentTime: dayjs().toISOString(),
    };
    const response = await request(server)
      .post(ApiEndpoint.ASSIGNMENT)
      .send(data)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
  });

  test("should not start a manual assignment while another assignment is in progress", async () => {
    // Another assignment is running -> the in-progress lock is held
    await findSettings();
    await acquireAssignmentLock();

    const data: PostAssignmentRequest = {
      assignmentTime: dayjs().toISOString(),
    };
    const response = await request(server)
      .post(ApiEndpoint.ASSIGNMENT)
      .send(data)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    expect(response.status).toEqual(200);

    const body = response.body as PostAssignmentError;
    expect(body.status).toEqual("error");
    expect(body.errorId).toEqual("assignmentInProgress");
  });

  test("should run a manual assignment and acquire the lock when none is in progress", async () => {
    // A fresh settings row means no assignment has run yet -> lock is free
    await findSettings();

    const data: PostAssignmentRequest = {
      assignmentTime: dayjs().toISOString(),
    };
    const response = await request(server)
      .post(ApiEndpoint.ASSIGNMENT)
      .send(data)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    expect(response.status).toEqual(200);
    const body = response.body as PostAssignmentResponse;
    expect(body.status).toEqual("success");
  });

  test("should release the lock after a run so a subsequent run is not blocked", async () => {
    await findSettings();

    const data: PostAssignmentRequest = {
      assignmentTime: dayjs().toISOString(),
    };
    const firstResponse = await request(server)
      .post(ApiEndpoint.ASSIGNMENT)
      .send(data)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect((firstResponse.body as PostAssignmentResponse).status).toEqual(
      "success",
    );

    // The first run released the lock on completion, so an immediate second run is not blocked
    const secondResponse = await request(server)
      .post(ApiEndpoint.ASSIGNMENT)
      .send(data)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect((secondResponse.body as PostAssignmentResponse).status).toEqual(
      "success",
    );
  });
});

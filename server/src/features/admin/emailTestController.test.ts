import { randomUUID } from "node:crypto";
import { Server } from "node:http";
import { addMinutes } from "date-fns";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostEmailTestRequest } from "shared/test-types/api/testData";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import { Locale } from "shared/types/locale";
import { UserGroup } from "shared/types/models/user";
import { getDateAndTime } from "shared/utils/timeFormatter";
import { EmailSender } from "server/features/notifications/email";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { getJWT } from "server/utils/jwt";
import { closeServer, startServer } from "server/utils/server";

let server: Server;

// Stub the actual send so the success path doesn't make a real SMTP/Ethereal
// network call; the controller still builds the message and shapes the response
const sendEmailSpy = vi.spyOn(EmailSender.prototype, "sendEmail");

beforeEach(async () => {
  sendEmailSpy.mockReset();
  sendEmailSpy.mockResolvedValue(undefined);
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: randomUUID(),
  });
});

afterEach(async () => {
  await closeServer(server);
});

describe(`POST ${ApiEndpoint.EMAIL_TEST}`, () => {
  test("should return 401 without authorization", async () => {
    const response = await request(server).post(ApiEndpoint.EMAIL_TEST);
    expect(response.status).toEqual(401);
  });

  test("should return 401 with non-admin authorization", async () => {
    const requestBody: PostEmailTestRequest = {
      email: "test@example.com",
      notificationType: EmailNotificationTrigger.ACCEPTED,
      programId: "test-program-item",
    };
    const response = await request(server)
      .post(ApiEndpoint.EMAIL_TEST)
      .send(requestBody)
      .set("Authorization", `Bearer ${getJWT(UserGroup.USER, "testuser")}`);
    expect(response.status).toEqual(401);
  });

  test("should return 422 with invalid body", async () => {
    const response = await request(server)
      .post(ApiEndpoint.EMAIL_TEST)
      .send({})
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(422);
  });

  test("should return 200 and send the email for an accepted notification", async () => {
    await saveProgramItems([testProgramItem]);

    const requestBody: PostEmailTestRequest = {
      email: "test@example.com",
      notificationType: EmailNotificationTrigger.ACCEPTED,
      programId: testProgramItem.programItemId,
    };
    const response = await request(server)
      .post(ApiEndpoint.EMAIL_TEST)
      .send(requestBody)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
  });

  test("should return 200 and send the email for a rejected notification", async () => {
    await saveProgramItems([testProgramItem]);
    const requestBody: PostEmailTestRequest = {
      email: "test@example.com",
      notificationType: EmailNotificationTrigger.REJECTED,
      programId: testProgramItem.programItemId,
    };
    const response = await request(server)
      .post(ApiEndpoint.EMAIL_TEST)
      .send(requestBody)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
  });

  test("should send the batched rejection for a batch parent ID", async () => {
    // A batched lottery's rejection names a span rather than one hour, so it has no single
    // program item to test through - the parent the batch is configured under stands in
    const [parentId, batchStartTime] = [
      ...config.event().startTimesByParentIds,
    ][0];
    const firstStartTime = addMinutes(
      new Date(batchStartTime),
      30,
    ).toISOString();
    const lastEndTime = addMinutes(new Date(batchStartTime), 90).toISOString();

    await saveProgramItems([
      { ...testProgramItem, parentId, startTime: firstStartTime },
      {
        ...testProgramItem2,
        parentId,
        startTime: addMinutes(new Date(batchStartTime), 60).toISOString(),
        endTime: lastEndTime,
      },
    ]);

    const requestBody: PostEmailTestRequest = {
      email: "test@example.com",
      notificationType: EmailNotificationTrigger.REJECTED,
      programId: parentId,
    };
    const response = await request(server)
      .post(ApiEndpoint.EMAIL_TEST)
      .send(requestBody)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    expect(response.status).toEqual(200);
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);

    // Names both ends of the span, which is what tells it apart from the single-hour rejection
    const [sentEmail] = sendEmailSpy.mock.calls[0];
    expect(sentEmail.text).toContain(getDateAndTime(firstStartTime, Locale.EN));
    expect(sentEmail.text).toContain(getDateAndTime(lastEndTime, Locale.EN));
  });

  test("should refuse a batch parent ID for a message that is not the rejection", async () => {
    const [parentId] = [...config.event().startTimesByParentIds][0];
    await saveProgramItems([{ ...testProgramItem, parentId }]);

    const requestBody: PostEmailTestRequest = {
      email: "test@example.com",
      notificationType: EmailNotificationTrigger.ACCEPTED,
      programId: parentId,
    };
    const response = await request(server)
      .post(ApiEndpoint.EMAIL_TEST)
      .send(requestBody)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    expect(response.status).toEqual(400);
    expect(sendEmailSpy).not.toHaveBeenCalled();
  });

  test("should return 500 when sending the email fails", async () => {
    await saveProgramItems([testProgramItem]);
    sendEmailSpy.mockRejectedValueOnce(new Error("SMTP failure"));
    const requestBody: PostEmailTestRequest = {
      email: "test@example.com",
      notificationType: EmailNotificationTrigger.ACCEPTED,
      programId: testProgramItem.programItemId,
    };
    const response = await request(server)
      .post(ApiEndpoint.EMAIL_TEST)
      .send(requestBody)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(500);
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
  });
});

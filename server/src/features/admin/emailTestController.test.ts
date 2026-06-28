import { Server } from "node:http";
import { expect, test, afterEach, describe, beforeEach, vi } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { closeServer, startServer } from "server/utils/server";
import { UserGroup } from "shared/types/models/user";
import { getJWT } from "server/utils/jwt";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import { PostEmailTestRequest } from "shared/test-types/api/testData";
import { EmailSender } from "server/features/notifications/email";

let server: Server;

// Stub the actual send so the success path doesn't make a real SMTP/Ethereal
// network call; the controller still builds the message and shapes the response
const sendEmailSpy = vi.spyOn(EmailSender.prototype, "sendEmail");

beforeEach(async () => {
  sendEmailSpy.mockReset();
  sendEmailSpy.mockResolvedValue(undefined);
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
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
    const requestBody: PostEmailTestRequest = {
      email: "test@example.com",
      notificationType: EmailNotificationTrigger.ACCEPTED,
      programId: "test-program-item",
    };
    const response = await request(server)
      .post(ApiEndpoint.EMAIL_TEST)
      .send(requestBody)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
  });

  test("should return 200 and send the email for a rejected notification", async () => {
    const requestBody: PostEmailTestRequest = {
      email: "test@example.com",
      notificationType: EmailNotificationTrigger.REJECTED,
      programId: "test-program-item",
    };
    const response = await request(server)
      .post(ApiEndpoint.EMAIL_TEST)
      .send(requestBody)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
  });

  test("should return 500 when sending the email fails", async () => {
    sendEmailSpy.mockRejectedValueOnce(new Error("SMTP failure"));
    const requestBody: PostEmailTestRequest = {
      email: "test@example.com",
      notificationType: EmailNotificationTrigger.ACCEPTED,
      programId: "test-program-item",
    };
    const response = await request(server)
      .post(ApiEndpoint.EMAIL_TEST)
      .send(requestBody)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(500);
  });
});

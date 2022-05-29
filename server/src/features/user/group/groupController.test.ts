import request from "supertest";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { GroupRequest } from "shared/typings/api/groups";

jest.mock("server/utils/logger");

afterEach(() => {
  jest.resetModules();
});

describe(`GET ${ApiEndpoint.GROUP}`, () => {
  test("should return 422 without valid body", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).get(ApiEndpoint.GROUP);
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 401 without valid authorization", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).get(ApiEndpoint.GROUP).query({
        username: "testuser",
        groupCode: "1234",
      });
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

describe(`POST ${ApiEndpoint.GROUP}`, () => {
  test("should return 422 without valid body", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const response = await request(server).post(ApiEndpoint.GROUP);
      expect(response.status).toEqual(422);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should return 401 without valid authorization", async () => {
    const { server, mongoServer } = await startTestServer();

    const groupRequest: GroupRequest = {
      groupCode: "1234",
      isGroupCreator: true,
      ownSerial: "1234",
      username: "testuser",
      leaveGroup: false,
      closeGroup: false,
    };

    try {
      const response = await request(server)
        .post(ApiEndpoint.GROUP)
        .send(groupRequest);
      expect(response.status).toEqual(401);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

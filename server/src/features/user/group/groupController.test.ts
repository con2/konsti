import request from "supertest";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { startTestServer, stopTestServer } from "server/test/utils/testServer";
import { GroupRequest } from "shared/typings/api/groups";
import { UserGroup } from "shared/typings/models/user";
import { getJWT } from "server/utils/jwt";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockSignedGames,
  mockUser,
  mockUser2,
} from "server/test/mock-data/mockUser";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { saveGames } from "server/features/game/gameRepository";
import { testGame, testGame2 } from "shared/tests/testGame";

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

  test("should create group", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      const user = await saveUser(mockUser);
      expect(user.groupCode).toEqual("0");

      const response = await request(server)
        .post(ApiEndpoint.GROUP)
        .send({
          groupCode: mockUser.serial,
          isGroupCreator: true,
          ownSerial: mockUser.serial,
          username: mockUser.username,
        })
        .set(
          "Authorization",
          `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
        );

      expect(response.status).toEqual(200);
      const updatedUser = await findUser(mockUser.username);
      expect(updatedUser?.groupCode).toEqual(user.serial);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should join group", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      await saveGames([testGame, testGame2]);
      await saveUser({ ...mockUser, groupCode: "1234ABCD" });
      await saveUser(mockUser2);
      const userWithSignups = await saveSignedGames({
        signedGames: mockSignedGames,
        username: mockUser2.username,
      });
      expect(userWithSignups.signedGames.length).toEqual(2);

      const response = await request(server)
        .post(ApiEndpoint.GROUP)
        .send({
          groupCode: mockUser.serial,
          isGroupCreator: false,
          ownSerial: mockUser2.serial,
          username: mockUser2.username,
        })
        .set(
          "Authorization",
          `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`
        );

      expect(response.status).toEqual(200);
      const updatedUser = await findUser(mockUser2.username);
      expect(updatedUser?.groupCode).toEqual(mockUser.serial);
      expect(updatedUser?.signedGames.length).toEqual(0);
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should leave group", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      await saveUser({ ...mockUser, groupCode: "1234ABCD" });
      await saveUser({ ...mockUser2, groupCode: "1234ABCD" });

      const response = await request(server)
        .post(ApiEndpoint.GROUP)
        .send({
          groupCode: mockUser.serial,
          isGroupCreator: false,
          ownSerial: mockUser2.serial,
          username: mockUser2.username,
          leaveGroup: true,
        })
        .set(
          "Authorization",
          `Bearer ${getJWT(UserGroup.USER, mockUser2.username)}`
        );

      expect(response.status).toEqual(200);
      const updatedUser = await findUser(mockUser2.username);
      expect(updatedUser?.groupCode).toEqual("0");
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });

  test("should close group and remove all group members", async () => {
    const { server, mongoServer } = await startTestServer();

    try {
      await saveUser({ ...mockUser, groupCode: "1234ABCD" });
      await saveUser({ ...mockUser2, groupCode: "1234ABCD" });

      const response = await request(server)
        .post(ApiEndpoint.GROUP)
        .send({
          groupCode: mockUser.serial,
          isGroupCreator: true,
          ownSerial: mockUser.serial,
          username: mockUser.username,
          leaveGroup: true,
          closeGroup: true,
        })
        .set(
          "Authorization",
          `Bearer ${getJWT(UserGroup.USER, mockUser.username)}`
        );

      expect(response.status).toEqual(200);
      const updatedUser = await findUser(mockUser2.username);
      expect(updatedUser?.groupCode).toEqual("0");
      const updatedUser2 = await findUser(mockUser2.username);
      expect(updatedUser2?.groupCode).toEqual("0");
    } finally {
      await stopTestServer(server, mongoServer);
    }
  });
});

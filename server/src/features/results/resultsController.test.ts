import { Server } from "node:http";
import { expect, test, describe, afterEach, beforeEach } from "vitest";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { testProgramItem } from "shared/tests/testProgramItem";
import {
  AssignmentResultGroup,
  UserAssignmentResult,
} from "shared/types/models/result";
import { GetResultsResponse } from "shared/types/api/results";
import { saveResult } from "server/features/results/resultsRepository";
import { closeServer, startServer } from "server/utils/server";

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

describe(`GET ${ApiEndpoint.RESULTS}`, () => {
  test("should return empty results when no lottery has been run", async () => {
    const response = await request(server).get(ApiEndpoint.RESULTS);

    expect(response.status).toEqual(200);
    const body = response.body as GetResultsResponse;
    expect(body).toEqual({
      message: "Getting results success",
      status: "success",
      assignmentRuns: [],
    });
  });

  test("should return assignment run metadata without user results or groups", async () => {
    const assignmentTime = "2023-05-07T14:00:00.000Z";
    const results: UserAssignmentResult[] = [
      {
        username: "testuser",
        assignmentSignup: {
          programItemId: testProgramItem.programItemId,
          priority: 1,
          signedToStartTime: testProgramItem.startTime,
        },
      },
    ];
    const groups: AssignmentResultGroup[] = [
      {
        groupCode: "1234",
        groupCreator: "testuser",
        groupMembers: ["testuser", "testuser2"],
      },
    ];
    await saveResult(
      results,
      groups,
      assignmentTime,
      AssignmentAlgorithm.PADG,
      "Test assignment",
    );

    const response = await request(server).get(ApiEndpoint.RESULTS);

    expect(response.status).toEqual(200);
    const body = response.body as GetResultsResponse;
    expect(body).toEqual({
      message: "Getting results success",
      status: "success",
      assignmentRuns: [
        {
          assignmentTime,
          algorithm: AssignmentAlgorithm.PADG,
          message: "Test assignment",
        },
      ],
    });
  });
});

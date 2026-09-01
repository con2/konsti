import { randomUUID } from "node:crypto";
import { Server } from "node:http";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { ServerConfig } from "shared/config/serverConfig";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { closeServer, startServer } from "server/utils/server";

let server: Server;

describe("Client-server instance", () => {
  beforeEach(async () => {
    server = await startServer({
      dbConnString: globalThis.__MONGO_URI__,
      dbName: randomUUID(),
    });
  });

  afterEach(async () => {
    await closeServer(server);
  });

  test("should return 400 if request is not valid json", async () => {
    const response = await request(server).post("/foobar").send("notJSON");
    expect(response.status).toEqual(400);
  });

  test("should return 404 for unknown API path", async () => {
    const response = await request(server).get("/api/foobar");
    expect(response.status).toEqual(404);
  });

  test("should return 404 for a path with a file extension", async () => {
    const response = await request(server).get("/wp-login.php");
    expect(response.status).toEqual(404);
  });

  test("should return 404 for a dotfile path", async () => {
    const response = await request(server).get("/.env");
    expect(response.status).toEqual(404);
  });

  test("should return 404 for a nested path with a file extension", async () => {
    const response = await request(server).get("/wp-content/plugins/shell.php");
    expect(response.status).toEqual(404);
  });

  test("should serve API routes", async () => {
    const response = await request(server).get(ApiEndpoint.SETTINGS);
    expect(response.status).toEqual(200);
  });
});

describe("Cronjob-only instance", () => {
  const startServerWithConfig = async (
    overrides: Partial<ServerConfig>,
  ): Promise<Server> => {
    vi.spyOn(config, "server").mockReturnValue({
      ...config.server(),
      ...overrides,
    });
    return await startServer({
      dbConnString: globalThis.__MONGO_URI__,
      dbName: randomUUID(),
    });
  };

  afterEach(async () => {
    await closeServer(server);
    vi.restoreAllMocks();
  });

  test("should serve health route for deployment probes", async () => {
    server = await startServerWithConfig({ onlyCronjobs: true });

    const response = await request(server).get(ApiEndpoint.HEALTH);
    expect(response.status).toEqual(200);
  });

  test("should not serve API routes", async () => {
    server = await startServerWithConfig({ onlyCronjobs: true });

    const response = await request(server).get(ApiEndpoint.SETTINGS);
    expect(response.status).toEqual(404);
  });

  test("should serve API routes when cronjobs and backend share instance", async () => {
    server = await startServerWithConfig({
      onlyCronjobs: true,
      cronjobsAndBackendSameInstance: true,
    });

    const response = await request(server).get(ApiEndpoint.SETTINGS);
    expect(response.status).toEqual(200);
  });
});

import { randomUUID } from "node:crypto";
import { Server } from "node:http";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { ServerConfig } from "shared/config/serverConfig";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { logger } from "server/utils/logger";
import { closeServer, startServer } from "server/utils/server";

let server: Server;

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

  // Every router is mounted at the app root, so one logging the requests it
  // doesn't serve would log each call once per router
  test("should log an API call once", async () => {
    vi.mocked(logger.info).mockClear();

    await request(server).get(ApiEndpoint.SETTINGS);

    const apiCallLogs = vi
      .mocked(logger.info)
      .mock.calls.map((call) => call[0])
      .filter((arg) => typeof arg === "string")
      .filter((message: string) => message.startsWith("API call:"));
    expect(apiCallLogs).toHaveLength(1);
  });
});

describe("Cross-origin client", () => {
  const clientOrigin = "http://localhost:8000";

  afterEach(async () => {
    await closeServer(server);
    vi.restoreAllMocks();
  });

  // The client dev server is a different origin from the API, and the network
  // probe is a plain fetch the browser drops without the header
  test("should allow the health route from an allowed origin", async () => {
    server = await startServerWithConfig({
      allowedCorsOrigins: [clientOrigin],
    });

    const response = await request(server)
      .get(ApiEndpoint.HEALTH)
      .set("Origin", clientOrigin);

    expect(response.headers["access-control-allow-origin"]).toEqual(
      clientOrigin,
    );
  });

  test("should block the health route from an unknown origin", async () => {
    server = await startServerWithConfig({
      allowedCorsOrigins: [clientOrigin],
    });

    const response = await request(server)
      .get(ApiEndpoint.HEALTH)
      .set("Origin", "http://evil.example");

    expect(response.status).toEqual(403);
  });
});

describe("Cronjob-only instance", () => {
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

  // The health route carries its own CORS middleware, so nothing else on the
  // instance answers a cross-origin caller
  test("should not handle CORS outside the health route", async () => {
    server = await startServerWithConfig({
      onlyCronjobs: true,
      allowedCorsOrigins: ["http://localhost:8000"],
    });

    const response = await request(server)
      .get(ApiEndpoint.SETTINGS)
      .set("Origin", "http://localhost:8000");

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
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

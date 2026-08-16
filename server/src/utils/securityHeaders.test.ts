import { Server } from "node:http";
import { faker } from "@faker-js/faker";
import request from "supertest";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { closeServer, startServer } from "server/utils/server";

// upgrade-insecure-requests rewrites every subresource URL to https. That is
// what the deployed profiles want and what a plain-http server must not send:
// WebKit applies the upgrade to loopback origins too (Chromium exempts them),
// so the whole bundle fails the TLS handshake and the page renders blank

let server: Server;

const getCspFor = async (settings: string): Promise<string> => {
  vi.stubEnv("SETTINGS", settings);
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
  });
  const response = await request(server).get(ApiEndpoint.HEALTH);
  return response.headers["content-security-policy"] ?? "";
};

afterEach(async () => {
  await closeServer(server);
  vi.unstubAllEnvs();
});

describe("Content-Security-Policy", () => {
  test.each(["production", "staging"])(
    "upgrades insecure requests in the TLS-served %s profile",
    async (settings) => {
      expect(await getCspFor(settings)).toContain("upgrade-insecure-requests");
    },
  );

  test.each(["development", "ci"])(
    "does not upgrade insecure requests in the http-served %s profile",
    async (settings) => {
      expect(await getCspFor(settings)).not.toContain(
        "upgrade-insecure-requests",
      );
    },
  );

  test("always restricts connect-src", async () => {
    expect(await getCspFor("production")).toContain("connect-src");
  });
});
